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

        const {user_id, user_role} = typeof refreshPayload === "string" ? JSON.parse(refreshPayload) : refreshPayload;

        if (!user_id || !user_role) {
            console.error("Error with parsing the refreshPayload: ", refreshPayload);
            return NextResponse.json({ error: "Invalid token payload." }, { status: 401 });
        }

        const accessToken = generateAccessToken({ user_id: user_id, user_role });
        if (!accessToken) {
            throw new Error("Failed to generate access token");
        }

        const response = NextResponse.json({ accessToken });
        response.cookies.set("accessToken", accessToken, {
            httpOnly: true,
            path: "/",
            sameSite: "strict",
            maxAge: 60 * 60,
        });

        return response;
    } catch (error) {
        console.error("Error during token refresh:", error);
        return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 });
    }
}