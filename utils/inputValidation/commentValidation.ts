
import prisma from "@/utils/client";

import { type ValidationError, type CommentPOSTBody, validBlogSortFields, type CommentGETQuery, validSortOrders } from "../interfaces";
import { isString, createError, MAX_CONTENT_LENGTH, isPositiveIntegerString, MAX_PAGE_SIZE,  } from "@/utils/inputValidation/generalValidation";
import { publicCommentWhere } from "@/utils/contentVisibility";



export function verifyCommentGETParams(params: CommentGETQuery) {
    const { blog_id, parent_comment_id, page, pageSize, sortBy, sortOrder } = params;

    if (parent_comment_id !== undefined) {
        if (!isPositiveIntegerString(parent_comment_id)) {
            return createError("Invalid parent id");
        }
    }
    if (blog_id === undefined || !isPositiveIntegerString(blog_id)) {
        return createError("Invalid blog id");
    }


    if (page !== undefined && !isPositiveIntegerString(page)) {
        return createError("Page should be a positive integer");
    }

    if (pageSize !== undefined) {
        if (!isPositiveIntegerString(pageSize)) {
            return createError("Page size should be a positive integer");
        }
        const pageSizeNumber = Number(pageSize);
        if (pageSizeNumber > MAX_PAGE_SIZE) {
            return createError(`Page size should be a number between 1 and  ${MAX_PAGE_SIZE}`);
        }
    }


    if (sortBy !== undefined && !validBlogSortFields.includes(sortBy as typeof validBlogSortFields[number])) {
        return createError("SortBy should be a valid sort field");
    }

    if (sortOrder !== undefined && !validSortOrders.includes(sortOrder as typeof validSortOrders[number])) {
        return createError("SortOrder should be 'asc' or 'desc'");
    }

    return null;
}

export async function verifyCommentPOSTBody(params: CommentPOSTBody, blogPostId: number): Promise<ValidationError | null> {
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
            const parentComment = await prisma.comment.findFirst({
                where: { id: parseInt(parent_comment_id), ...publicCommentWhere() },
                select: { blogPostId: true },
            });
            if (!parentComment) {
                return createError("Parent comment does not exist", 404);
            }
            if (parentComment.blogPostId !== blogPostId) {
                return createError("Parent comment must belong to the requested blog post");
            }
        }
    }

    return null;
}
