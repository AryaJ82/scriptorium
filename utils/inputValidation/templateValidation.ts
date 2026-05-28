
import prisma from "@/utils/client";
import { validTemplateSortFields, validSortOrders } from "@/utils/interfaces";
import type { TemplateGETQuery, TemplatePOSTBody, TemplatePATCHBody, ValidationError } from "@/utils/interfaces";
export type { TemplateGETQuery, TemplatePOSTBody, TemplatePATCHBody } from "@/utils/interfaces";

import { isValidCUID, isString, isValidLanguage, createError, validateTagsArray, isPositiveIntegerString, isOptionalString, MAX_TITLE_LENGTH, MAX_CONTENT_LENGTH, MAX_USERNAME_LENGTH, MAX_PAGE_SIZE, MAX_CODE_SIZE } from "@/utils/inputValidation/generalValidation";
export { normalizeTags } from "@/utils/inputValidation/generalValidation";


export async function templateExists(value: unknown): Promise<boolean> {
    // Returns true if `value` is a valid cuid which exists in the template table
    if (!isValidCUID(value)) return false;

    const template = await prisma.template.findUnique({ where: { id: value as string } });
    return !!template;
}

export function verifyGETParams(params: TemplateGETQuery) {
    const { title, template_id, language, tags, content, author, page, pageSize, sortBy, sortOrder } = params;

    if (template_id !== undefined) {
        if (!isValidCUID(template_id)) {
            return createError("Invalid template cuid");
        }
    }

    if (!isOptionalString(title, MAX_TITLE_LENGTH)) {
        return createError("Title should be a string with at most 255 characters");
    }

    if (language !== undefined) {
        if (!isValidLanguage(language)) {
            return createError("Invalid language");
        }
    }

    if (!isOptionalString(tags, 100)) {
        return createError("tags should be a string with at most 100 characters");
    }

    if (!isOptionalString(content, MAX_CONTENT_LENGTH)) {
        return createError(`content should be a string with at most ${MAX_CONTENT_LENGTH} characters`);
    }

    if (author !== undefined) {
        if (!isOptionalString(author, MAX_USERNAME_LENGTH)) {
            return createError(`Author should be a string with at most ${MAX_USERNAME_LENGTH} characters`);
        }
    }

    if (!isPositiveIntegerString(page)) {
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
        return createError("Invalid template title");
    } else if (title.length > MAX_TITLE_LENGTH) {
        return createError(`title should be a string with at most ${MAX_TITLE_LENGTH} characters`);
    }

    if (code !== undefined) {
        // Code can be undefined 
        if (!isString(code) || Buffer.byteLength(code) > MAX_CODE_SIZE) {
            return createError(`Code should be a string with at most ${MAX_CODE_SIZE / 1024} KB`);
        }
    }

    if (!isValidLanguage(language)) {
        return createError("Unsupported language");
    }

    if (!isOptionalString(description, MAX_CONTENT_LENGTH)) {
        return createError(`Description should be a string with at most ${MAX_CONTENT_LENGTH} characters`);
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
        } else if (title.length > MAX_TITLE_LENGTH) {
            return createError(`title should be a string with at most ${MAX_TITLE_LENGTH} characters`);
        }
    }

    if (code !== undefined) {
        if (!isString(code) || Buffer.byteLength(code) > MAX_CODE_SIZE) {
            return createError(`Code should be a string with at most ${MAX_CODE_SIZE / 1024} KB`);
        }
    }

    if (language !== undefined) {
        if (!isValidLanguage(language)) {
            return createError("Unsupported language");
        }
    }

    if (description !== undefined) {
        if (!isString(description) || description.length > MAX_CONTENT_LENGTH) {
            return createError("Description should be a string with at most 2000 characters");
        }
    }

    const error = validateTagsArray(tags);
    if (error) {
        return error;
    }

    return null;
}
