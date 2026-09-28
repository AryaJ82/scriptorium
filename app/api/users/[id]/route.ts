import { NextRequest } from "next/server";
import { withAuth } from "@/utils/middlewareAuth";
import prisma from "@/utils/client";
import type { AuthenticatedRequest } from "@/utils/middlewareAuth";
import type { UserProfilePATCHBody } from "@/utils/interfaces";
import { verifyUserProfilePATCHBody } from "@/utils/inputValidation/userValidation";
import { apiError, apiSuccess } from "@/utils/apiResponse";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }
            const { id } = await params;
            if (user.id !== id) {
                return apiError("Unauthorized", 401);
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
                return apiError("User not found", 404);
            }

            return apiSuccess(profile);

        } catch (error) {
            return apiError(`Internal server error while fetching user profile: ${error}`, 500);
        }
    })(request);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }
            const { id } = await params;
            if (user.id !== id) {
                return apiError("Unauthorized", 401);
            }
            const body: UserProfilePATCHBody = await request.json();
            const error = verifyUserProfilePATCHBody(body);
            if (error) {
                return apiError(error.message, error.status ?? 400);
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
            return apiSuccess(updatedUser);
        } catch (error) {
            console.error("Error during profile update:", error);
            return apiError("Invalid request body during profile editing", 400);
        }
    })(request);
}