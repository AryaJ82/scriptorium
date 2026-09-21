import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client"
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";
import { commentResponseInclude } from "@/utils/interfaces";

// PUT /api/comments/[id]/vote - Add or confirm a downvote
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return NextResponse.json({ error: "Invalid comment id." }, { status: 400 });
            }

            const comment = await prisma.comment.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    downvotingUsers: { where: { id: user.id }, select: { id: true } }
                },
            });
            if (!comment) {
                return NextResponse.json({ error: "comment not found" }, { status: 404 });
            }

            const hasDownvoted = comment.downvotingUsers.length > 0;
            
            const updatedComment = await prisma.comment.update({
                where: { id: comment.id },
                data: {
                    ...(hasDownvoted ? {} : {
                        downvoteCount: { increment: 1 },
                        downvotingUsers: { connect: { id: user.id } },
                    }),
                },
                ...commentResponseInclude({ currentUserId: user.id })
            });

            return NextResponse.json({ comment: updatedComment }, { status: 200 });
        } catch (error) {
            console.error("Error when downvoting comment:", error);
            return NextResponse.json({ error: "Internal server error when downvoting comment" }, { status: 500 });
        }
    })(request);
}

// DELETE /api/comments/[id]/vote - Remove an downvote
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return NextResponse.json({ error: "Invalid comment id." }, { status: 400 });
            }

            const comment = await prisma.comment.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    downvotingUsers: { where: { id: user.id }, select: { id: true } }
                },
            });
            if (!comment) {
                return NextResponse.json({ error: "comment not found" }, { status: 404 });
            }

            const hasDownvoted = comment.downvotingUsers.length > 0;
            
            const updatedComment = await prisma.comment.update({
                where: { id: comment.id },
                data: {
                    ...(hasDownvoted ? {
                        downvoteCount: { increment: -1 },
                        downvotingUsers: { disconnect: { id: user.id } },
                    } : {}),
                },
                ...commentResponseInclude({ currentUserId: user.id })
            });

            return NextResponse.json({ comment: updatedComment }, { status: 200 });
        } catch (error) {
            console.error("Error when removing downvote from comment:", error);
            return NextResponse.json({ error: "Internal server error when removing downvote" }, { status: 500 });
        }
    })(request);
}
