import { verifyRefreshToken, setAccessCookie } from "@/utils/tokenAuth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client";

export async function GET(request: NextRequest) {
    
    try {
        const refreshToken = request.cookies.get('refreshToken')?.value ?? null;
        if (!refreshToken) {
            return NextResponse.json({ error: "Refresh token is required." }, { status: 400 });
        }

        const refreshPayload = verifyRefreshToken(refreshToken);
        if (!refreshPayload) {
            return NextResponse.json({ error: "Invalid refresh token." }, { status: 401 });
        }

        const { user_id, user_role } = typeof refreshPayload === "string" ? JSON.parse(refreshPayload) : refreshPayload;
        if (!user_id || !user_role) {
            console.error("Error with parsing the refreshPayload: ", refreshPayload);
            return NextResponse.json({ error: "Invalid refresh token." }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: user_id } });
        if (!user) {
            console.error("Failed to find user");
            return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
        }

        const response = NextResponse.json({ message: "Token refresh succesful" }, { status: 200 });
        setAccessCookie(response, { user_id: user_id, user_role })

        return response;
    } catch (error) {
        console.error("Error during token refresh:", error);
        return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 });
    }
}