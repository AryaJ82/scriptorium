import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client";
import { comparePassword } from "@/utils/passwordAuth";
import { setAccessCookie, setRefreshCookie } from "@/utils/tokenAuth";
import { verifyUsername, verifyPassword } from "@/utils/inputValidation/userValidation";
import type { UserLoginPOSTBody } from "@/utils/interfaces";

export async function POST(request: NextRequest) {
    try {
        const body: UserLoginPOSTBody = await request.json();
        const { username, password } = body;
        const error = verifyUsername(username) || verifyPassword(password);
        if (error) {
            return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: {
                username: username
            },
        });
        if (!user) {
            return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
        }

        if (!(await comparePassword(password, user.passwordHash))) {
            return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
        }

        const response = NextResponse.json({
            message:"Login Succesful",
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            role: user.role,

        }, { status: 200 });
        setAccessCookie(response, { user_id: user.id, user_role: user.role });
        setRefreshCookie(response, { user_id: user.id, user_role: user.role });

        return response;

    } catch (error) {
        console.error("Error during user login:", error);
        return NextResponse.json({ error: "An error occurred while logging in" }, { status: 500 });
    }
}