
import prisma from "@/utils/client";
import { validBlogSortFields, validSortOrders } from "@/utils/interfaces";
import type { ValidationError, BlogPOSTBody, BlogPATCHBody, BlogGETQuery } from "@/utils/interfaces";
export type { ValidationError, BlogPOSTBody, BlogPATCHBody, BlogGETQuery } from "@/utils/interfaces";

import { isString, createError, validateTagsArray, isPositiveIntegerString, isOptionalString } from "@/utils/inputValidation/generalValidation";
export { normalizeTags } from "@/utils/inputValidation/generalValidation";

export function verifyGETParams(params: BlogGETQuery) {
    const { post_id, linked_template_id, title, content, tags, author, page, pageSize, sortBy, sortOrder } = params;

    if (post_id !== undefined && !isPositiveIntegerString(post_id)) {
        return createError("post_id should be a positive integer");
    }

    if (title !== undefined && !isOptionalString(title, 255)) {
        return createError("Title should be a string with at most 255 characters");
    }

    if (linked_template_id !== undefined && !isOptionalString(linked_template_id, 255)) {
        return createError("linked_template_id should be a string with at most 30 characters");
    }

    if (tags !== undefined) {
        if (!isString(tags) || tags.trim() === "" || tags.length > 50) {
            return createError("Tags should be a non-empty string with at most 50 characters");
        }
    }

    if (content !== undefined && !isOptionalString(content, 1000)) {
        return createError("Description should be a string with at most 1000 characters");
    }

    if (author !== undefined && !isOptionalString(author, 100)) {
        return createError("Author should be a string with at most 100 characters");
    }

    if (page !== undefined && !isPositiveIntegerString(page)) {
        return createError("Page should be a positive integer");
    }

    if (pageSize !== undefined) {
        if (!isPositiveIntegerString(pageSize)) {
            return createError("Page size should be a positive integer");
        }
        const pageSizeNumber = Number(pageSize);
        if (pageSizeNumber > 100) {
            return createError("Page size should be a number between 1 and 100");
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


export async function verifyPOSTParams(params: BlogPOSTBody) {
    const { title, content, linked_template_id, tags } = params;

    if (linked_template_id !== undefined) {
        if (!isString(linked_template_id) || linked_template_id.trim() === "") {
            return createError("linked_template_id should be a non-empty string if provided");
        }
        const sourceTemplate = await prisma.template.findUnique({ where: { id: linked_template_id } });
        if (!sourceTemplate) {
            return createError("No template found for the provided linked_template_id", 400);
        }
    }

    if (!isString(title) || title.trim() === "") {
        return createError("Please provide a valid title");
    }
    if (title.length > 255) {
        return createError("Title must be less than 255 characters");
    }


    if (!isString(content) || content.trim() === "") {
        return createError("Please provide a valid description");
    }
    if (content.length > 10000) {
        return createError("description must be less than 10000 characters");
    }

    const tagsValidation = validateTagsArray(tags);
    if (tagsValidation) {
        return tagsValidation;
    }
    return null;
}

export async function verifyPATCHParams(body: BlogPATCHBody): Promise<ValidationError | null> {
    const { title, content, tags } = body;

    if (title === undefined && content === undefined && tags === undefined) {
        return createError("At least one field must be provided to update the blog post");
    }

    if (title !== undefined) {
        if (!isString(title) || title.trim() === "") {
            return createError("Please provide a valid title");
        }
        if (title.length > 255) {
            return createError("Title must be less than 255 characters");
        }
    }

    if (content !== undefined) {
        if (!isString(content) || content.length > 2000) {
            return createError("Description should be a string with at most 2000 characters");
        }
    }

    const error = validateTagsArray(tags);
    if (error) {
        return error;
    }

    return null;
}
