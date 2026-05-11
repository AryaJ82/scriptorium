import { NextResponse } from "next/server";
import { withAuth } from "@/utils/middlewareAuth";
import prisma from "@/utils/client";
import type {AuthenticatedRequest} from "@/utils/middlewareAuth";

export async function GET(request: Request) {
    try {
        // TODO: make this a query || username
        const { user_id } = await request.json();
        if (!user_id) {
            return NextResponse.json({ message: "Invalid user_id" }, { status: 400 });
        }
        const user = prisma.user.findUnique({
            where: { id: user_id },
            select: {
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                phoneNumber: true,
                createdTemplates: true,
            }
        });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: `Internal server error while fetching user profile: ${error}` }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { email, firstName, lastName, avatarUrl, phoneNumber, } = await request.json();
            const { user } = request;
            if(!user){
                throw Error("User not loaded into request while editing profile")
            }

            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: {
                    ...(email && { email }),
                    ...(firstName && { firstName }),
                    ...(lastName && { lastName }),
                    ...(avatarUrl && { avatarUrl }),
                    ...(phoneNumber && { phoneNumber })
                },
                select:{
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                    phoneNumber: true,
                }
            });
            return NextResponse.json({ user: updatedUser }, { status: 200 });
        } catch (error) {
            console.error("Error during profile update:", error);
            return NextResponse.json({ error: "Invalid request body during profile editing" }, { status: 400 });
        }
    })(request);
}