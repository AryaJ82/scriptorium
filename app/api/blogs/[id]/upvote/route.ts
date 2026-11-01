import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextRequest } from "next/server";
import prisma from "@/utils/client"
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";
import { blogResponseInclude } from "@/utils/interfaces";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { publicBlogWhere } from "@/utils/contentVisibility";

// PUT /api/blogs/[id]/vote - Add or confirm an upvote
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return apiError("Invalid blog id.", 400);
            }

            const blog = await prisma.blogPost.findFirst({
                where: { id: parseInt(id), ...publicBlogWhere() },
                select: {
                    id: true,
                    upvotingUsers: { where: { id: user.id }, select: { id: true } }
                },
            });
            if (!blog) {
                return apiError("Blog not found", 404);
            }

            const hasUpvoted = blog.upvotingUsers.length > 0;
            
            const updatedBlog = await prisma.blogPost.update({
                where: { id: blog.id },
                data: {
                    ...(hasUpvoted ? {} : {
                        upvoteCount: { increment: 1 },
                        upvotingUsers: { connect: { id: user.id } },
                    }),
                },
                ...blogResponseInclude({ currentUserId: user.id })
            });

            return apiSuccess(updatedBlog);
        } catch (error) {
            console.error("Error when upvoting blog:", error);
            return apiError("Internal server error when upvoting blog", 500);
        }
    })(request);
}

// DELETE /api/blogs/[id]/vote - Remove an upvote
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return apiError("Invalid blog id.", 400);
            }

            const blog = await prisma.blogPost.findFirst({
                where: { id: parseInt(id), ...publicBlogWhere() },
                select: {
                    id: true,
                    upvotingUsers: { where: { id: user.id }, select: { id: true } }
                },
            });
            if (!blog) {
                return apiError("Blog not found", 404);
            }

            // DELETE is idempotent: only decrement if currently upvoted
            const hasUpvoted = blog.upvotingUsers.length > 0;
            
            const updatedBlog = await prisma.blogPost.update({
                where: { id: blog.id },
                data: {
                    ...(hasUpvoted ? {
                        upvoteCount: { increment: -1 },
                        upvotingUsers: { disconnect: { id: user.id } },
                    } : {}),
                },
                ...blogResponseInclude({ currentUserId: user.id })
            });

            return apiSuccess(updatedBlog);
        } catch (error) {
            console.error("Error when removing upvote from blog:", error);
            return apiError("Internal server error when removing upvote", 500);
        }
    })(request);
}
