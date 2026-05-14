
import { NextResponse } from "next/server";
import prisma from "@/utils/client"
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    if (!id || isNaN(Number(id))) {
        return NextResponse.json({ error: "Invalid Blog post id is required" }, { status: 400 });
    }

    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthoruized" }, { status: 401 });
            }
            const { content } = await request.json();

            const blogPost = await prisma.blogPost.findUnique({
                where: { id: Number(id) },
            });
            if (!blogPost) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }

            const comment = await prisma.comment.create({
                data: {
                    author: { connect: { id: user.id } },
                    blogPost: { connect: { id: blogPost.id } },
                    content: content, // TODO: verifyu content
                    ...(parent_comment_id && {})
                },

                select: {
                    author: true,
                    content: true,
                    createdAt: true,
                    blogPostId: true,
                    parentCommentId: true,
                }
            })

            return NextResponse.json({ comment }, { status: 200 });

        } catch (error) {
            console.error("Error fetching blog posts at [id] route", error);
            return NextResponse.json({ error: "Internal server error when fetching blog posts at [id] route" }, { status: 500 });
        }
    })(request);
}