
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client";
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { limitedAuthorSelect, type CommentPOSTBody } from "@/utils/interfaces";
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";
import { verifyCommentPOSTBody } from "@/utils/inputValidation/commentValidation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;
            const body: CommentPOSTBody = await request.json();
            const error = await verifyCommentPOSTBody(body);
            if (error) {
                return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
            }
            const { content, parent_comment_id } = body;

            if (!isPositiveIntegerString(id)) {
                return NextResponse.json({ error: "Blog post id is required" }, { status: 400 });
            }
            const blogPost = await prisma.blogPost.findUnique({ where: { id: parseInt(id) }, });
            if (!blogPost) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }

            const comment = await prisma.comment.create({
                data: {
                    author: { connect: { id: user.id } },
                    blogPost: { connect: { id: blogPost.id } },
                    content: content,
                    ...(parent_comment_id && {
                        parentComment: { connect: { id: parseInt(parent_comment_id) } },
                    }),
                },
                include: {
                    author: limitedAuthorSelect,
                    parentComment: {
                        select: {
                            id: true
                        }
                    }
                },
            });

            return NextResponse.json({ comment }, { status: 200 });
        } catch (error) {
            console.error("Error posting comment at [id] route", error);
            return NextResponse.json({ error: "Internal server error when posting comment" }, { status: 500 });
        }
    })(request);
}