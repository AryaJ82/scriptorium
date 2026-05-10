import { NextResponse } from "next/server";
import prisma from "@/utils/client";
import { comparePassword } from "@/utils/passwordAuth";
import { generateAccessToken, generateRefreshToken } from "@/utils/tokenAuth";

export async function GET(request: Request) {
    return NextResponse.json({ message: "Hello from the login API!" });
}

export async function POST(request: Request) {
    const { username, password } = await request.json();
    try {
        if (!username || !password) {
            return NextResponse.json({ error: "Username, and password are required" }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: {
                username: username
            }
        });
        if (!existingUser) {
            console.error("Failed to find user");
            return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
        }

        if (! await comparePassword(password, existingUser.passwordHash)) {
            console.error("Failed to match pass hash");
            return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
        }
        const accessToken = generateAccessToken({ userId: existingUser.id, userRole: existingUser.role });
        const refreshToken = generateRefreshToken({ uid: existingUser.id, role: existingUser.role });

        return NextResponse.json({ accessToken, refreshToken }, { status: 200 });

    } catch (error) {
        console.error("Error during user login:", error);
        return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 });
    }
}