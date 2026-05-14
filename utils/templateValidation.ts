import { NextResponse } from "next/server";
import prisma from "@/utils/client";
import { Language } from "@/app/generated/prisma/enums";
import type { TemplateGETQuery, TemplatePOSTBody, TemplatePATCHBody, ValidationError } from "@/utils/interfaces";
export type { TemplateGETQuery, TemplatePOSTBody, TemplatePATCHBody } from "@/utils/interfaces";;




const validSortFields = ["title", "createdAt", "language"] as const;
const validSortOrders = ["asc", "desc"] as const;



function createError(message: string, status = 400): ValidationError {
    return { message, status };
}

function isString(value: unknown): value is string {
    return typeof value === "string";
}

function isOptionalString(value: unknown, maxLength: number): boolean {
    return value === undefined || (isString(value) && value.length <= maxLength);
}

export function isPositiveIntegerString(value: unknown): boolean {
    return isString(value) && /^\d+$/.test(value) && Number(value) >= 1;
}

function isValidLanguage(language: unknown): language is Language {
    return isString(language) && Object.values(Language).includes(language as Language);
}

function validateTagValue(tag: unknown): ValidationError | null {
    if (!isString(tag) || tag.trim() === "") {
        return createError("Each tag should be a non-empty string");
    }
    const normalizedTag = tag.trim();
    if (normalizedTag.length > 50) {
        return createError("Each tag must be less than 50 characters");
    }
    if (/\s/.test(normalizedTag) || /[,&]/.test(normalizedTag)) {
        return createError("Invalid character in tag");
    }
    return null;
}

export function validateTags(tags: unknown): ValidationError | null {
    if (tags === undefined) {
        return null;
    }
    if (!Array.isArray(tags)) {
        return createError("Tags should be an array of strings");
    }
    for (const tag of tags) {
        const validated = validateTagValue(tag);
        if (!validated) {
            return validated;
        }
    }
    return null;
}

export function normalizeTags(tags: string[] | undefined): string[] {
    if (!Array.isArray(tags)) {
        return [];
    }
    return Array.from(
        new Set(
            tags
                .filter((tag) => typeof tag === "string")
                .map((tag) => tag.trim().toLowerCase())
                .filter(Boolean)
        )
    );
}

export function verifyGETParams(params: TemplateGETQuery) {
    const { title, template_id, language, tags, content, author, page, pageSize, sortBy, sortOrder } = params;

    if (template_id !== undefined && !isOptionalString(title, 255)) {
        return NextResponse.json({ error: "Title should be a string with at most 255 characters" }, { status: 400 });
    }

    if (title !== undefined && !isOptionalString(title, 255)) {
        return NextResponse.json({ error: "Title should be a string with at most 255 characters" }, { status: 400 });
    }

    if (language !== undefined && !isValidLanguage(language)) {
        return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    if (tags !== undefined) {
        if (!isString(tags) || tags.trim() === "" || tags.length > 50) {
            return NextResponse.json({ error: "Tags should be a non-empty string with at most 50 characters" }, { status: 400 });
        }
    }

    if (content !== undefined && !isOptionalString(content, 1000)) {
        return NextResponse.json({ error: "Content should be a string with at most 1000 characters" }, { status: 400 });
    }

    if (author !== undefined && !isOptionalString(author, 100)) {
        return NextResponse.json({ error: "Author should be a string with at most 100 characters" }, { status: 400 });
    }

    if (page !== undefined && !isPositiveIntegerString(page)) {
        return NextResponse.json({ error: "Page should be a positive integer" }, { status: 400 });
    }

    if (pageSize !== undefined) {
        if (!isPositiveIntegerString(pageSize)) {
            return NextResponse.json({ error: "Page size should be a positive integer" }, { status: 400 });
        }
        const pageSizeNumber = Number(pageSize);
        if (pageSizeNumber > 100) {
            return NextResponse.json({ error: "Page size should be a number between 1 and 100" }, { status: 400 });
        }
    }

    if (sortBy !== undefined && !validSortFields.includes(sortBy as typeof validSortFields[number])) {
        return NextResponse.json({ error: "SortBy should be a valid sort field" }, { status: 400 });
    }

    if (sortOrder !== undefined && !validSortOrders.includes(sortOrder as typeof validSortOrders[number])) {
        return NextResponse.json({ error: "SortOrder should be 'asc' or 'desc'" }, { status: 400 });
    }

    return null;
}

export async function verifyPOSTParams(body: TemplatePOSTBody): Promise<ValidationError | null> {
    const { title, code, description, language, tags, forkedSourceId } = body;

    if (!isString(title) || title.trim() === "") {
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

    if (description !== undefined) {
        if (!isString(description) || description.length > 2000) {
            return createError("Description should be a string with at most 2000 characters");
        }
    }

    const tagsValidation = validateTags(tags);
    if (!tagsValidation) {
        return tagsValidation;
    }

    if (forkedSourceId !== undefined) {
        if (!isString(forkedSourceId) || forkedSourceId.trim() === "") {
            return createError("forkedSourceId should be a non-empty string if provided");
        }
        const sourceTemplate = await prisma.template.findUnique({ where: { id: forkedSourceId } });
        if (!sourceTemplate) {
            return createError("No template found to fork from with the provided forkedSourceId", 400);
        }
    }

    return null;
}

export async function verifyPATCHParams(body: TemplatePATCHBody): Promise<ValidationError | null> {
    const { template_id, title, code, language, description, tags } = body;

    if (!isString(template_id) || template_id.trim() === "") {
        return createError("template_id is required and must be a non-empty string");
    }

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

    const tagsValidation = validateTags(tags);
    if (!tagsValidation) {
        return tagsValidation;
    }

    return null;
}
