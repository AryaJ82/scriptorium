import { withAuth } from "@/utils/middlewareAuth";
import { verifyRefreshToken, generateAccessToken } from "@/utils/tokenAuth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { refreshToken } = await request.json();
        if (!refreshToken) {
            return NextResponse.json({ error: "Refresh token is required." }, { status: 400 });
        }
        const refreshPayload = verifyRefreshToken(refreshToken);
        if (!refreshPayload) {
            return NextResponse.json({ error: "Invalid refresh token." }, { status: 401 });
        }

        const {userId, userRole} = typeof refreshPayload === "string" ? JSON.parse(refreshPayload) : refreshPayload;

        if (!userId || !userRole) {
            console.error("Error with parsing the refreshPayload: ", refreshPayload);
            return NextResponse.json({ error: "Invalid token payload." }, { status: 401 });
        }

        const accessToken = generateAccessToken({ userId: userId, userRole: userRole });
        if (!accessToken) {
            throw new Error("Failed to generate access token");
        }

        return NextResponse.json({ accessToken });
    } catch (error) {
        console.error("Error during token refresh:", error);
        return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 });
    }
}