import { NextResponse, NextRequest } from "next/server";
import { verifyAccessToken } from "@/utils/tokenAuth";
import type { JwtPayload } from "jsonwebtoken"
import prisma from '@/utils/client';
import { apiError } from "@/utils/apiResponse";

import type { AuthenticatedRequest } from "./interfaces";
export type { AuthenticatedRequest } from "./interfaces";

export function withAuth(handler: (request: AuthenticatedRequest) => (Promise<NextResponse<object>>)): (request: NextRequest) => (Promise<NextResponse<object>>) {
    return async (request: NextRequest) => {

        try {
            const accessToken = request.cookies.get('accessToken')?.value ?? null;
            if (!accessToken) {
                return apiError("Unauthorized: failed to parse access token", 401);
            }
            const authPayload = verifyAccessToken(accessToken);
            if (!authPayload) {
                console.error("AccessToken failed verification");
                return apiError("Unauthorized", 401);
            }
            const payload = typeof authPayload === "string" ? JSON.parse(authPayload) : authPayload as JwtPayload;

            const { user_id } = payload;

            if (!user_id) {
                console.error("Error with parsing the authPayload: ", authPayload);

                return apiError("Invalid Token (userId and role not parsed)", 401);
            }
            const user = await prisma.user.findUnique({ where: { id: user_id } });
            if (!user) {
                return apiError('User not found', 404);
            }

            Object.assign(request, { user });
            return handler(request as AuthenticatedRequest);

        } catch (error) {
            console.error("Error in withAuth middleware:", error);
            return apiError("Internal Server Error", 500);
        }
    }
}

export function withAdmin(handler: (request: AuthenticatedRequest) => (Promise<NextResponse<object>>)): (request: NextRequest) => (Promise<NextResponse<object>>) {
    return withAuth((authRequest: AuthenticatedRequest) => {
        try {
            const { user } = authRequest;
            if (!user || user.role !== "ADMIN") {
                return Promise.resolve(apiError("Unauthorized", 401));
            }
            return handler(authRequest);
            
        } catch (error) {
            console.error("Error in withAdmin middleware:", error);
            return Promise.resolve(apiError("Internal Server Error", 500));
        }
    });
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
