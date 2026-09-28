import { NextRequest } from "next/server";
import prisma from '@/utils/client';
import { hashPassword } from "@/utils/passwordAuth";
import { verifyUsername, verifyPassword } from "@/utils/inputValidation/userValidation";
import type { UserRegisterPOSTBody } from "@/utils/interfaces";
import { apiError, apiSuccess } from "@/utils/apiResponse";

export async function POST(request: NextRequest) {
    try {
    const body: UserRegisterPOSTBody = await request.json();
    const { username, password } = body;
        let error = verifyUsername(username);
        if (error) {
            return apiError(error.message, error.status ?? 400);
        }
        error = verifyPassword(password);
        if (error) {
            return apiError(error.message, error.status ?? 400);
        }
        
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                username: username
            }
        });
        if (existingUser) {
            return apiError("Username already in use.", 400);
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

        return apiSuccess(newUser, 201);

    } catch (error) {
        console.error("Error during user registration:", error);
        return apiError("An error occurred while processing the request", 500);
    }
}

