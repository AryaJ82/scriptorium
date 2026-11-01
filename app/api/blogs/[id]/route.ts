
import { AuthenticatedRequest, getOptionalUser, withAuth } from "@/utils/middlewareAuth";
import { normalizeTags, verifyPATCHBody } from "@/utils/inputValidation/blogValidation";
import type { BlogPATCHBody } from "@/utils/interfaces";
import { NextRequest } from "next/server";
import prisma from "@/utils/client"
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";
import { blogResponseInclude } from "@/utils/interfaces";
import { apiError, apiSuccess } from "@/utils/apiResponse";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!isPositiveIntegerString(id)) {
            return apiError("Invalid Blog post id.", 400);
        }


        const currentUser = await getOptionalUser(request);
        const currentUserId = currentUser?.id ?? undefined;
        
        const post = await prisma.blogPost.findUnique({
            where: { id: parseInt(id) },
            ...blogResponseInclude({currentUserId}),
        });

        if (!post) {
            return apiError("Blog Post not found", 404);
        }

        return apiSuccess(post, 200);

    } catch (error) {
        console.error("Error fetching blog posts at [id] route", error);
        return apiError("Internal server error when fetching blog posts at [id] route", 500);
    }
}


export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return apiError("Invalid Blog post id.", 400);
            }

            const body: BlogPATCHBody = await request.json();
            const patchValidationError = verifyPATCHBody(body);
            if (patchValidationError) {
                return apiError(patchValidationError.message, patchValidationError.status);
            }
            const { title, content, tags } = body;

            const post = await prisma.blogPost.findUnique({
            where: { id: parseInt(id), isHidden: false },

                select: { id: true, authorId: true }
            });
            if (!post) {
                return apiError("post not found", 404);
            } else if (post.authorId !== user.id) {
                return apiError("Forbidden", 403);
            }

            const tagConnectOrCreate = tags !== undefined ? normalizeTags(tags).map((tag) => ({
                where: { name: tag },
                create: { name: tag },
            })) : undefined;

            const currentUserId = user.id;
            const updatedPost = await prisma.blogPost.update({
                where: { id: post.id },
                data: {
                    ...(title && { title: title.trim() }),
                    ...(content !== undefined && { content }),
                    ...(tagConnectOrCreate !== undefined && {
                        tags: {
                            set: [],
                            connectOrCreate: tagConnectOrCreate,
                        },
                    }),
                },
                ...blogResponseInclude({currentUserId}),
            });

            return apiSuccess(updatedPost);
        } catch (error) {
            console.error("Error when updating blog post:", error);
            return apiError("Internal server error when updating blog post", 500);
        }
    })(request);
}


export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return apiError("Invalid Blog post id.", 400);
            }

            const post = await prisma.blogPost.findUnique({ where: { id: parseInt(id) }, });

            if (!post) {
                return apiError("Blog Post not found", 404);
            }
            if (post.authorId !== user.id) {
                return apiError("Forbidden.", 403);
            }

            await prisma.blogPost.delete({ where: { id: post.id } });
            return apiSuccess({ message: "Deleted successfully" });

        } catch (error) {
            console.error("Error when deleting blog post", error);
            return apiError("Internal server error when deleting blog post", 500);
        }
    })(request);
}
