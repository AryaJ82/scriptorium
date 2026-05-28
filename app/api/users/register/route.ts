import { NextResponse, NextRequest } from "next/server";
import prisma from '@/utils/client';
import { hashPassword } from "@/utils/passwordAuth";
import { verifyUsername, verifyPassword } from "@/utils/inputValidation/userValidation";
import type { UserRegisterPOSTBody } from "@/utils/interfaces";

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: "Hello from the registration API!" });
}

export async function POST(request: NextRequest) {
    const body: UserRegisterPOSTBody = await request.json();
    const { username, password } = body;
    try {
        let error = verifyUsername(username);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
        }
        error = verifyPassword(password);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
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

