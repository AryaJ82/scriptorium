
import { AuthenticatedRequest, getOptionalUser, withAuth } from "@/utils/middlewareAuth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client"
import { commentResponseInclude, limitedAuthorSelect } from "@/utils/interfaces";
import { isPositiveIntegerString, isString, MAX_CONTENT_LENGTH } from "@/utils/inputValidation/generalValidation";


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!isPositiveIntegerString(id)) {
            return NextResponse.json({ error: "Invalid Comment id." }, { status: 400 });
        }

        const currentUser = await getOptionalUser(request);
        const currentUserId = currentUser?.id;
        const comment = await prisma.comment.findUnique({
            where: { id: parseInt(id) },
            ...commentResponseInclude({ currentUserId })
        });

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        return NextResponse.json({ comment }, { status: 200 });

    } catch (error) {
        console.error("Error fetching comments at [id] route", error);
        return NextResponse.json({ error: "Internal server error when fetching comments at [id] route" }, { status: 500 });
    }
}

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

            const { content } = await request.json();
            if (!isString(content) || content.length > MAX_CONTENT_LENGTH) {
                return NextResponse.json({ error: "Invalid content" }, { status: 400 })
            }

            const comment = await prisma.comment.findUnique({
                where: { id: parseInt(id) },
            });
            if (!comment) {
                return NextResponse.json({ error: "Comment not found" }, { status: 404 });
            } else if (comment.authorId !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            const newComment = await prisma.comment.update({
                where: { id: parseInt(id) },
                data: { content: content },
                include: {
                    author: limitedAuthorSelect,
                    upvotingUsers: { where: { id: { equals: user.id } }, select: { id: true } },
                    downvotingUsers: { where: { id: { equals: user.id } }, select: { id: true } }
                }
            }
            )

            return NextResponse.json({ comment: newComment }, { status: 200 });

        } catch (error) {
            console.error("Error fetching comments at [id] route", error);
            return NextResponse.json({ error: "Internal server error when fetching comments at [id] route" }, { status: 500 });
        }
    })(request)
}



export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return NextResponse.json({ error: "Invalid Blog post id." }, { status: 400 });
            }

            const comment = await prisma.comment.findUnique({
                where: { id: parseInt(id) },
                select: { id: true, authorId: true }
            });

            if (!comment) {
                return NextResponse.json({ error: "Comment not found." }, { status: 404 });
            }
            if (comment.authorId !== user.id) {
                return NextResponse.json({ error: "Forbidden." }, { status: 403 });
            }

            await prisma.comment.delete({ where: { id: comment.id } });
            
            return NextResponse.json({ message: "Comment deleted successfully" }, { status: 200 });

        } catch (error) {
            console.error("Error when deleting comment", error);
            return NextResponse.json({ error: "Internal server error when deleting comment" }, { status: 500 });
        }
    })(request);
}