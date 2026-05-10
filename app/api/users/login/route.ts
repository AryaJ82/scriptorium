import { NextResponse } from "next/server";
import prisma from "@/utils/client";
import { comparePassword } from "@/utils/passwordAuth";
import { generateAccessToken, generateRefreshToken } from "@/utils/tokenAuth";
import { access } from "fs";

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
        const accessToken = generateAccessToken({ userId: user.id, userRole: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, userRole: user.role });

        if (!accessToken || !refreshToken) {
            throw new Error("Failed to generate tokens");
        }

        // Return tokens as cookies
        let response = NextResponse.json({ message: "Login successful", accessToken: accessToken, refreshToken: refreshToken });
        response.cookies.set("accessToken", accessToken, {
            httpOnly: true,
            path: "/",
            sameSite: "strict",
            maxAge: 60 * 15 // 15 minutes
        });

        response.cookies.set("refreshToken", refreshToken, {
            httpOnly: true,
            path: "/",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error) {
        console.error("Error during user login:", error);
        return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 });
    }
}