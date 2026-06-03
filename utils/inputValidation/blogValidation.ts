
import prisma from "@/utils/client";
import { validBlogSortFields, validSortOrders } from "@/utils/interfaces";
import type { ValidationError, BlogPOSTBody, BlogPATCHBody, BlogGETQuery } from "@/utils/interfaces";
export type { ValidationError, BlogPOSTBody, BlogPATCHBody, BlogGETQuery } from "@/utils/interfaces";

import { isString, createError, validateTagsArray, isPositiveIntegerString, isOptionalString, isValidCUID, MAX_TITLE_LENGTH, MAX_CONTENT_LENGTH, MAX_PAGE_SIZE, MAX_USERNAME_LENGTH } from "@/utils/inputValidation/generalValidation";
export { normalizeTags } from "@/utils/inputValidation/generalValidation";

export function verifyGETParams(params: BlogGETQuery) {
    const { post_id, linked_template_id, title, content, tags, author, page, pageSize, sortBy, sortOrder } = params;

    if (post_id !== undefined && !isPositiveIntegerString(post_id)) {
        return createError("post_id should be a positive integer");
    }

    if (!isOptionalString(title, MAX_TITLE_LENGTH)) {
        return createError(`title should be a string with at most ${MAX_TITLE_LENGTH} characters`);
    }

    if (linked_template_id !== undefined) {
        if (!isValidCUID(linked_template_id)) {
            // Note: we do not check for existence since this is a GET query
            return createError("linked_template_id should be a valid cuid");
        }
    }

    if (!isOptionalString(tags, 100)) {
        return createError("tags should be a string with at most 100 characters");
    }

    if (!isOptionalString(content, MAX_CONTENT_LENGTH)) {
        return createError("content should be a string with at most 1000 characters");
    }

    if (author !== undefined) {
        if (!isOptionalString(author, MAX_USERNAME_LENGTH)) {
            return createError(`Author should be a string with at most ${MAX_USERNAME_LENGTH} characters`);
        }
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


export async function verifyPOSTBody(params: BlogPOSTBody): Promise<ValidationError | null> {
    const { title, content, linked_template_id, tags } = params;

    if (linked_template_id !== undefined) {
        if (!isString(linked_template_id) || linked_template_id.trim() === "") {
            return createError("linked_template_id should be a non-empty string if provided");
        }
        const sourceTemplate = await prisma.template.findUnique({ where: { id: linked_template_id } });
        if (!sourceTemplate) {
            return createError("No template found for the provided linked_template_id", 404);
        }
    }

    if (title === undefined || !isString(title) || title.trim() === "") {
        return createError("Invalid blog title");
    } else if (title.length > MAX_TITLE_LENGTH) {
        return createError(`title should be a string with at most ${MAX_TITLE_LENGTH} characters`);
    }

    if (content === undefined || !isString(content) || content.trim() === "") {
        return createError("Invalid blog content");
    } else if (content.length > MAX_CONTENT_LENGTH) {
        return createError(`blog content must be less than  ${MAX_CONTENT_LENGTH} characters`);
    }

    const tagsValidation = validateTagsArray(tags);
    if (tagsValidation) {
        return tagsValidation;
    }
    return null;
}

export function verifyPATCHBody(body: BlogPATCHBody): ValidationError | null {
    const { title, content, tags } = body;

    if (title === undefined && content === undefined && tags === undefined) {
        return createError("At least one field must be provided to update the blog post");
    }

    if (!isOptionalString(title, MAX_TITLE_LENGTH) || title?.trim() === "") {
        return createError("Invalid title")
    }

    if (!isOptionalString(content, MAX_CONTENT_LENGTH)) {
        return createError("Description should be a string with at most 10000 characters");
    }

    const error = validateTagsArray(tags);
    if (error) {
        return error;
    }

    return null;
}
