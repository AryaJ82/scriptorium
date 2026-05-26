import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client";
import { comparePassword } from "@/utils/passwordAuth";
import { setAccessCookie, setRefreshCookie } from "@/utils/tokenAuth";
import { verifyUsername, verifyPassword } from "@/utils/inputValidation/generalValidation"

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: "Hello from the login API!" });
}

export async function POST(request: NextRequest) {
    const { username, password } = await request.json();
    try {
        if (!verifyUsername(username) || !verifyPassword(password)) {
            return NextResponse.json({ error: "Username, and password are required" }, { status: 400 });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        });
        if (!user) {
            console.error("Failed to find user");
            return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
        }

        if (!(await comparePassword(password, user.passwordHash))) {
            console.error("Failed to match pass hash");
            return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
        }

        const response = NextResponse.json({ message: "Login successful" }, { status: 200 });
        setAccessCookie(response, { user_id: user.id, user_role: user.role });
        setRefreshCookie(response, { user_id: user.id, user_role: user.role });

        return response;

    } catch (error) {
        console.error("Error during user login:", error);
        return NextResponse.json({ error: "An error occurred while logging in" }, { status: 500 });
    }
}