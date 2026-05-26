import { NextResponse, NextRequest } from "next/server";
import prisma from '@/utils/client';
import { hashPassword } from "@/utils/passwordAuth";
import {verifyUsername, verifyPassword} from "@/utils/inputValidation/generalValidation"

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: "Hello from the registration API!" });
}

export async function POST(request: NextRequest) {
    const { username, password } = await request.json();
    try {
        if (!username || !password) {
            return NextResponse.json({ error: "Username, and password are required" }, { status: 400 });
        } else if (!verifyUsername(username)) {
            return NextResponse.json({ error: "Username must be between 3 and 20 characters long." }, { status: 400 });
        } else if( !verifyPassword(password) ) {
            return NextResponse.json({ error: "Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters." }, { status: 400 });
        }
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                username: username
            }
        });
        if (existingUser) {
            return NextResponse.json({ error: "Username already in use." }, { status: 400 });
        }

        const newUser = await prisma.user.create({
            data: {
                username,
                passwordHash: await hashPassword(password),
                role: "USER"
            },
            select: {
                id: true,
                username: true,
                role: true
            }
        });

        return NextResponse.json({ user: newUser }, { status: 201 });

    } catch (error) {
        console.error("Error during user registration:", error);
        return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 });
    }
}

