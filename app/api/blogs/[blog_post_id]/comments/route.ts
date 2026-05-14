
import { NextResponse } from "next/server";
import prisma from "@/utils/client";
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";

export async function POST(request: Request, { params }: { params: { blog_post_id: string } }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { blog_post_id } = params;
            const { parent_comment_id } = await request.json();
            if (!blog_post_id || isNaN(Number(blog_post_id))) {
                return NextResponse.json({ error: "Blog post id is required" }, { status: 400 });
            }
            if (parent_comment_id && isNaN(Number(parent_comment_id))) {
                return NextResponse.json({ error: "Invalid parent comment id" }, { status: 400 });
            }

            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { content } = await request.json();
            if (!content || typeof content !== "string" || content.trim() === "") {
                return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
            }

            const blogPost = await prisma.blogPost.findUnique({
                where: { id: Number(blog_post_id) },
            });
            if (!blogPost) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }

            const comment = await prisma.comment.create({
                data: {
                    author: { connect: { id: user.id } },
                    blogPost: { connect: { id: blogPost.id } },
                    content,
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
            console.error("Error fetching blog posts at [id] route", error);
            return NextResponse.json({ error: "Internal server error when fetching blog posts at [id] route" }, { status: 500 });
        }
    })(request);
}