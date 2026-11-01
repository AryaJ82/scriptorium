
import { AuthenticatedRequest, getOptionalUser, withAuth } from "@/utils/middlewareAuth";
import { NextRequest } from "next/server";
import prisma from "@/utils/client"
import { commentResponseInclude, limitedAuthorSelect } from "@/utils/interfaces";
import { isPositiveIntegerString, isString, MAX_CONTENT_LENGTH } from "@/utils/inputValidation/generalValidation";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { publicCommentWhere } from "@/utils/contentVisibility";


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!isPositiveIntegerString(id)) {
            return apiError("Invalid Comment id.", 400);
        }

        const currentUser = await getOptionalUser(request);
        const currentUserId = currentUser?.id;
        const comment = await prisma.comment.findFirst({
            where: { id: parseInt(id), ...publicCommentWhere() },
            ...commentResponseInclude({ currentUserId })
        });

        if (!comment) {
            return apiError("Comment not found", 404);
        }

        return apiSuccess(comment);

    } catch (error) {
        console.error("Error fetching comments at [id] route", error);
        return apiError("Internal server error when fetching comments at [id] route", 500);
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
                return apiError("Invalid Comment id.", 400);
            }

            const { content } = await request.json();
            if (!isString(content) || content.length > MAX_CONTENT_LENGTH) {
                return apiError("Invalid content", 400);
            }

            const comment = await prisma.comment.findFirst({
                where: { id: parseInt(id), ...publicCommentWhere() },
            });
            if (!comment) {
                return apiError("Comment not found", 404);
            } else if (comment.authorId !== user.id) {
                return apiError("Forbidden", 403);
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

            return apiSuccess(newComment);

        } catch (error) {
            console.error("Error fetching comments at [id] route", error);
            return apiError("Internal server error when updating comment", 500);
        }
    })(request)
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
                return apiError("Invalid Comment id.", 400);
            }

            const comment = await prisma.comment.findFirst({
                where: { id: parseInt(id), ...publicCommentWhere() },
                select: { id: true, authorId: true }
            });

            if (!comment) {
                return apiError("Comment not found.", 404);
            }
            if (comment.authorId !== user.id) {
                return apiError("Forbidden.", 403);
            }

            await prisma.comment.delete({ where: { id: comment.id } });
            
            return apiSuccess({ message: "Comment deleted successfully" });

        } catch (error) {
            console.error("Error when deleting comment", error);
            return apiError("Internal server error when deleting comment", 500);
        }
    })(request);
}