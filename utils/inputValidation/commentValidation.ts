
import prisma from "@/utils/client";

import type { ValidationError, CommentPOSTBody } from "../interfaces";
import { isString, createError, MAX_CONTENT_LENGTH, isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";

export async function verifyCommentPOSTBody(params: CommentPOSTBody): Promise<ValidationError | null> {
    const { content, parent_comment_id } = params;

    if (content === undefined || !isString(content) || content.trim() === "") {
        return createError("Invalid blog comment content");
    } else if (content.length > MAX_CONTENT_LENGTH) {
        return createError(`blog comment content must be less than ${MAX_CONTENT_LENGTH} characters`);
    }

    if (parent_comment_id !== undefined) {
        if (!isPositiveIntegerString(parent_comment_id)) {
            return createError("Invalid parent comment id");
        } else {
            const parentComment = await prisma.comment.findUnique({ where: { id: parseInt(parent_comment_id) }, });
            if (!parentComment) {
                return createError("Parent comment does not exist", 404);
            }
        }
    }

    return null;
}

