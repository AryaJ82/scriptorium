
import { NextResponse } from "next/server";
import prisma from "@/utils/client";
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { id } = await params;
            const { content, parent_comment_id } = await request.json();
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (!content || typeof content !== "string" || content.trim() === "") {
                return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
            }

            if (!id || isNaN(Number(id))) {
                return NextResponse.json({ error: "Blog post id is required" }, { status: 400 });
            }
            const blogPost = await prisma.blogPost.findUnique({ where: { id: Number(id) }, });
            if (!blogPost) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }

            if (parent_comment_id !== undefined) {
                if (isNaN(Number(parent_comment_id))) {
                return NextResponse.json({ error: "Invalid parent comment id" }, { status: 400 });
                } else {
                    const parentComment = await prisma.comment.findUnique({ where: { id: Number(parent_comment_id) }, });
                    if (!parentComment) {
                        return NextResponse.json({ error: "Parent comment does not exist" }, { status: 404 });
                    }
                }
            }


            const comment = await prisma.comment.create({
                data: {
                    author: { connect: { id: user.id } },
                    blogPost: { connect: { id: blogPost.id } },
                    content: content, // TODO: verifyu content
                    ...(parent_comment_id && {
                        parentComment: { connect: { id: Number(parent_comment_id) } },
                    }),
                },
                select: {
                    author: true,
                    content: true,
                    createdAt: true,
                    blogPostId: true,
                    parentCommentId: true,
                },
            });

            return NextResponse.json({ comment }, { status: 200 });
        } catch (error) {
            console.error("Error posting comment at [id] route", error);
            return NextResponse.json({ error: "Internal server error when posting comment" }, { status: 500 });
        }
    })(request);
}