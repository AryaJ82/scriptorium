import { NextResponse, NextRequest } from "next/server";
import { withAuth } from "@/utils/middlewareAuth";
import prisma from "@/utils/client";
import type { AuthenticatedRequest } from "@/utils/middlewareAuth";
import type { UserProfilePATCHBody } from "@/utils/interfaces";
import { verifyUserProfilePATCHBody } from "@/utils/inputValidation/userValidation";

export async function GET(request: NextRequest) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const profile = await prisma.user.findUnique({
                where: { id: user.id },
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                    phoneNumber: true,
                    role: true,
                    createdAt: true,
                    createdTemplates: true,
                }
            });

            if (!profile) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            return NextResponse.json({ user: profile }, { status: 200 });

        } catch (error) {
            return NextResponse.json({ error: `Internal server error while fetching user profile: ${error}` }, { status: 500 });
        }
    })(request);
}

export async function PATCH(request: NextRequest) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const body: UserProfilePATCHBody = await request.json();
            const error = verifyUserProfilePATCHBody(body);
            if (error) {
                return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
            }
            const { email, firstName, lastName, avatarUrl, phoneNumber } = body;

            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    ...(email && { email }),
                    ...(firstName && { firstName }),
                    ...(lastName && { lastName }),
                    ...(avatarUrl && { avatarUrl }),
                    ...(phoneNumber && { phoneNumber }),
                },
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                    phoneNumber: true,
                },
            });
            return NextResponse.json({ user: updatedUser }, { status: 200 });
        } catch (error) {
            console.error("Error during profile update:", error);
            return NextResponse.json({ error: "Invalid request body during profile editing" }, { status: 400 });
        }
    })(request);
}