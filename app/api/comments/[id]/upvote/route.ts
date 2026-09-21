import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client"
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";
import { commentResponseInclude } from "@/utils/interfaces";

// PUT /api/comments/[id]/vote - Add or confirm an upvote
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
                    upvotingUsers: { where: { id: user.id }, select: { id: true } }
                },
            });
            if (!comment) {
                return NextResponse.json({ error: "comment not found" }, { status: 404 });
            }

            const hasUpvoted = comment.upvotingUsers.length > 0;
            
            const updatedComment = await prisma.comment.update({
                where: { id: comment.id },
                data: {
                    ...(hasUpvoted ? {} : {
                        upvoteCount: { increment: 1 },
                        upvotingUsers: { connect: { id: user.id } },
                    }),
                },
                ...commentResponseInclude({ currentUserId: user.id })
            });

            return NextResponse.json({ comment: updatedComment }, { status: 200 });
        } catch (error) {
            console.error("Error when upvoting comment:", error);
            return NextResponse.json({ error: "Internal server error when upvoting comment" }, { status: 500 });
        }
    })(request);
}

// DELETE /api/comments/[id]/vote - Remove an upvote
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
                    upvotingUsers: { where: { id: user.id }, select: { id: true } }
                },
            });
            if (!comment) {
                return NextResponse.json({ error: "comment not found" }, { status: 404 });
            }

            // DELETE is idempotent: only decrement if currently upvoted
            const hasUpvoted = comment.upvotingUsers.length > 0;
            
            const updatedComment = await prisma.comment.update({
                where: { id: comment.id },
                data: {
                    ...(hasUpvoted ? {
                        upvoteCount: { increment: -1 },
                        upvotingUsers: { disconnect: { id: user.id } },
                    } : {}),
                },
                ...commentResponseInclude({ currentUserId: user.id })
            });

            return NextResponse.json({ comment: updatedComment }, { status: 200 });
        } catch (error) {
            console.error("Error when removing upvote from comment:", error);
            return NextResponse.json({ error: "Internal server error when removing upvote" }, { status: 500 });
        }
    })(request);
}
