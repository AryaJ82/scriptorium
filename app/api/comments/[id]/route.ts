
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse } from "next/server";
import prisma from "@/utils/client"


export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: "Invalid Comment id." }, { status: 400 });
        }

        const comment = await prisma.comment.findUnique({
            where: { id: Number(id) },
            include: {
                author: true,
                parentComment: true,
                blogPost: {
                    select: {
                        id: true,
                        author: true,
                        title: true,
                        createdAt: true,
                    }
                },
            },
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


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { id } = params;
            const post_id = Number(id);
            if (!id || isNaN(post_id) || post_id < 0) {
                return NextResponse.json({ error: "Invalid comment post id." }, { status: 400 });
            }

            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const comment = await prisma.comment.findUnique({ where: { id: post_id }, });

            if (!comment) {
                return NextResponse.json({ error: "Comment not found" }, { status: 404 });
            }
            if (comment.authorId !== user.id) {
                return NextResponse.json({ error: "Unauthorized to delete this comment" }, { status: 403 });
            }

            await prisma.comment.delete({ where: { id: post_id } });
            return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });

        } catch (error) {
            console.error("Error when deleting comment", error);
            return NextResponse.json({ error: "Internal server error when deleting comment" }, { status: 500 });
        }
    })(request);
}