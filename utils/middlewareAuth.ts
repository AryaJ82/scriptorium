import { NextResponse, NextRequest } from "next/server";
import { verifyAccessToken } from "@/utils/tokenAuth";
import type { JwtPayload } from "jsonwebtoken"
import prisma from '@/utils/client';

import type { AuthenticatedRequest } from "./interfaces";
export type { AuthenticatedRequest } from "./interfaces";

/**
 * Middleware to protect API routes with token verification and role-based access.
 * @param {function} handler - The API route handler to wrap.
 * @returns {function} - A new handler function with token verification and role-based access.
 */
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