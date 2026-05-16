
import prisma from "@/utils/client";
import { validTemplateSortFields, validSortOrders } from "@/utils/interfaces";
import type { TemplateGETQuery, TemplatePOSTBody, TemplatePATCHBody, ValidationError } from "@/utils/interfaces";
export type { TemplateGETQuery, TemplatePOSTBody, TemplatePATCHBody } from "@/utils/interfaces";

import { isValidCUID, isString, isValidLanguage, createError, validateTagsArray, isPositiveIntegerString, isOptionalString } from "@/utils/inputValidation/generalValidation";
export { normalizeTags } from "@/utils/inputValidation/generalValidation";


export async function templateExists(value: unknown): Promise<boolean> {
    // Returns true if `value` is a valid cuid which exists in the template table
    if (!isValidCUID(value)) return false;

    const template = await prisma.template.findUnique({ where: { id: value as string } });
    return !!template;
}

export function verifyGETParams(params: TemplateGETQuery) {
    const { title, template_id, language, tags, content, author, page, pageSize, sortBy, sortOrder } = params;

    if (template_id !== undefined && !isValidCUID(template_id)) {
        return createError("Invalid template cuid");
    }

    if (title !== undefined && !isOptionalString(title, 255)) {
        return createError("Title should be a string with at most 255 characters");
    }

    if (language !== undefined && !isValidLanguage(language)) {
        return createError("Invalid language");
    }

    if (tags !== undefined) {
        if (!isString(tags) || tags.trim() === "" || tags.length > 50) {
            return createError("Tags should be a non-empty string with at most 50 characters");
        }
    }

    if (content !== undefined && !isOptionalString(content, 1000)) {
        return createError("Content should be a string with at most 1000 characters");
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

    if (sortBy !== undefined && !validTemplateSortFields.includes(sortBy as typeof validTemplateSortFields[number])) {
        return createError("SortBy should be a valid sort field");
    }

    if (sortOrder !== undefined && !validSortOrders.includes(sortOrder as typeof validSortOrders[number])) {
        return createError("SortOrder should be 'asc' or 'desc'");
    }

    return null;
}

export async function verifyPOSTParams(body: TemplatePOSTBody): Promise<ValidationError | null> {
    const { title, code, description, language, tags, forkedSourceId } = body;

    if (title === undefined || !isString(title) || title.trim() === "") {
        return createError("Please provide a valid title");
    }
    if (title.length > 255) {
        return createError("Title must be less than 255 characters");
    }

    if (code !== undefined && !isString(code)) {
        return createError("Code should be a string");
    }

    if (!isValidLanguage(language)) {
        return createError("Unsupported language");
    }

    if (!isOptionalString(description, 2000)) {
        return createError("Description should be a string with at most 2000 characters");
    }

    const error = validateTagsArray(tags);
    if (error) {
        return error;
    }

    if (forkedSourceId !== undefined) {
        if (!isValidCUID(forkedSourceId)) {
            return createError("forkedSourceId should be a valid CUID if provided");
        }
        if (!templateExists(forkedSourceId)) {
            return createError("No template found with the provided forkedSourceId", 404);
        }
    }

    return null;
}

export function verifyPATCHParams(body: TemplatePATCHBody): ValidationError | null {
    const { title, code, language, description, tags } = body;

    if (title === undefined && code === undefined && language === undefined && description === undefined && tags === undefined) {
        return createError("At least one field must be provided to update the template");
    }

    if (title !== undefined) {
        if (!isString(title) || title.trim() === "") {
            return createError("Please provide a valid title");
        }
        if (title.length > 255) {
            return createError("Title must be less than 255 characters");
        }
    }

    if (code !== undefined && !isString(code)) {
        return createError("Code should be a string");
    }

    if (language !== undefined && !isValidLanguage(language)) {
        return createError("Unsupported language");
    }

    if (description !== undefined) {
        if (!isString(description) || description.length > 2000) {
            return createError("Description should be a string with at most 2000 characters");
        }
    }

    const error = validateTagsArray(tags);
    if (error) {
        return error;
    }

    return null;
}
