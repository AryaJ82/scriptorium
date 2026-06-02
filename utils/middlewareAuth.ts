import { NextResponse, NextRequest } from "next/server";
import { verifyAccessToken } from "@/utils/tokenAuth";
import type { JwtPayload } from "jsonwebtoken"
import prisma from '@/utils/client';

import type { AuthenticatedRequest } from "./interfaces";
export type { AuthenticatedRequest } from "./interfaces";

export function withAuth(handler: (request: AuthenticatedRequest) => (Promise<NextResponse<{}>>)): (request: NextRequest) => (Promise<NextResponse<{}>>) {
    return async (request: NextRequest) => {
        
        try {
            const accessToken = request.cookies.get('accessToken')?.value ?? null;
            if (!accessToken) {
                return NextResponse.json(
                    { error: "Unauthorized: failed to parse access token" },
                    { status: 401 },
                );
            }
            const authPayload = verifyAccessToken(accessToken);
            if (!authPayload) {
                console.error("AccessToken failed verification");
                return NextResponse.json(
                    { error: "Unauthorized"},
                    { status: 401 },
                );
            }
            const payload = typeof authPayload === "string" ? JSON.parse(authPayload) : authPayload as JwtPayload;

            const { user_id } = payload;

            if (!user_id) {
                console.error("Error with parsing the authPayload: ", authPayload);

                return NextResponse.json(
                    { error: "Invalid Token (userId and role not parsed)" },
                    { status: 401 },
                );
            }
            const user = await prisma.user.findUnique({ where: { id: user_id } });
            if (!user) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }


            if (request.url.includes("/api/admin") && user.role !== "ADMIN") {
                return NextResponse.json(
                    { error: "Forbidden" },
                    { status: 403 }
                );
            }

            Object.assign(request, { user });
            return handler(request as AuthenticatedRequest);

        } catch (error) {
            console.error("Error in withAuth middleware:", error);
            return NextResponse.json(
                { error: "Internal Server Error" },
                { status: 500 }
            );
        }
    }
}

export async function getOptionalUser(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('accessToken')?.value ?? null;
        if (!accessToken) return null;

        const authPayload = verifyAccessToken(accessToken);
        if (!authPayload) return null;

        const payload = typeof authPayload === "string"
            ? JSON.parse(authPayload)
            : authPayload as JwtPayload;

        const userId = payload.user_id as string | undefined;
        if (!userId) return null;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        return user;
    } catch (error) {
        console.error("Error in getOptionalUser:", error);
        return null;
    }
}