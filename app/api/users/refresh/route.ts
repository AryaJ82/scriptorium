import { verifyRefreshToken, setAccessCookie } from "@/utils/tokenAuth";
import { NextRequest } from "next/server";
import prisma from "@/utils/client";
import { apiError, apiSuccess } from "@/utils/apiResponse";

export async function GET(request: NextRequest) {

    try {
        const refreshToken = request.cookies.get('refreshToken')?.value ?? null;
        if (!refreshToken) {
            return apiError("Refresh token is required.", 400);
        }

        const refreshPayload = verifyRefreshToken(refreshToken);
        if (!refreshPayload) {
            return apiError("Invalid refresh token.", 401);
        }

        const { user_id, user_role } = typeof refreshPayload === "string" ? JSON.parse(refreshPayload) : refreshPayload;
        if (!user_id || !user_role) {
            console.error("Error with parsing the refreshPayload: ", refreshPayload);
            return apiError("Invalid refresh token.", 401);
        }

        const user = await prisma.user.findUnique({ where: { id: user_id } });
        if (!user) {
            console.error("Failed to find user");
            return apiError("Invalid username or password.", 401);
        }

        const response = apiSuccess({
            message: "Token refresh succesful",
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            role: user.role,
        });
        setAccessCookie(response, { user_id: user_id, user_role })

        return response;
    } catch (error) {
        console.error("Error during token refresh:", error);
        return apiError("An error occurred while processing the request", 500);
    }
}