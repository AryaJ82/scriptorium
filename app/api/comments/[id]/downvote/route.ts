
import { AuthenticatedRequest, getOptionalUser, withAuth } from "@/utils/middlewareAuth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client"
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";
import { commentResponseInclude } from "@/utils/interfaces";


// Increment downvote count for a comment
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return NextResponse.json({ error: "Invalid Comment id." }, { status: 400 });
            }

            const comment = await prisma.comment.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    downvotingUsers: { where: { id: user.id }, select: { id: true } }
                },
            });
            if (!comment) {
                return NextResponse.json({ error: "Comment not found" }, { status: 404 });
            }

            // Check if user has already downvoted this comment
            const hasDownvoted = comment.downvotingUsers.length > 0;
            
            const currentUser = await getOptionalUser(request);
            const currentUserId = currentUser?.id;
            // increment downvoteCount and create downvote connection
            const updatedComment = await prisma.comment.update({
                where: { id: comment.id },
                data: {
                    downvoteCount: { increment: hasDownvoted ? -1 : 1 },
                    downvotingUsers: hasDownvoted
                        ? { disconnect: { id: user.id } }
                        : { connect: { id: user.id } },
                },
                ...commentResponseInclude({ currentUserId })
            });

            return NextResponse.json({ comment: updatedComment }, { status: 200 });
        } catch (error) {
            console.error("Error when downvoting comment:", error);
            return NextResponse.json({ error: "Internal server error when downvoting comment" }, { status: 500 });
        }
    })(request);
}