
import { NextRequest } from "next/server";
import prisma from "@/utils/client";
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { limitedAuthorSelect, type CommentPOSTBody } from "@/utils/interfaces";
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";
import { verifyCommentPOSTBody } from "@/utils/inputValidation/commentValidation";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { publicBlogWhere } from "@/utils/contentVisibility";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return apiError("Blog post id is required", 400);
            }
            const blogPostId = parseInt(id);

            const body: CommentPOSTBody = await request.json();
            const error = await verifyCommentPOSTBody(body, blogPostId);
            if (error) {
                return apiError(error.message, error.status ?? 400);
            }
            const { content, parent_comment_id } = body;

            const blogPost = await prisma.blogPost.findFirst({
                where: { id: blogPostId, ...publicBlogWhere() },
            });
            if (!blogPost) {
                return apiError("Blog not found", 404);
            }

            const comment = await prisma.comment.create({
                data: {
                    author: { connect: { id: user.id } },
                    blogPost: { connect: { id: blogPost.id } },
                    content: content,
                    ...(parent_comment_id && {
                        parentComment: { connect: { id: parseInt(parent_comment_id, 10) } },
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

            return apiSuccess(comment);
        } catch (error) {
            console.error("Error posting comment at [id] route", error);
            return apiError("Internal server error when posting comment", 500);
        }
    })(request);
}