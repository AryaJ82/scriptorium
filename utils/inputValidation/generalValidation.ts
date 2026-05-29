
import { ValidationError } from "@/utils/interfaces";
import { Language } from "@/utils/interfaces";


// ------------------------------------ Constants

export const MAX_TITLE_LENGTH = 255;
export const MAX_CONTENT_LENGTH = 10000;
export const MAX_PAGE_SIZE = 100;

export const MAX_USERNAME_LENGTH = 30;
export const MAX_PASSWORD_LENGTH = 100;

export const MAX_CODE_SIZE = !isNaN(parseInt(process.env.MAX_CODE_SIZE_KB ?? "")) ? parseInt(process.env.MAX_CODE_SIZE_KB ?? "") * 1024 : 64 * 1024;
export const MAX_STDIN_SIZE = !isNaN(Number(process.env.MAX_STDIN_SIZE_KB)) ? Number(process.env.MAX_STDIN_SIZE_KB) * 1024 : 64 * 1024;

// ----------------------------------------- Error
export function createError(message: string, status = 400): ValidationError {
    return { message, status };
}


// ----------------------------------------- Strings

export function isString(value: unknown): value is string {
    return typeof value === "string";
}

export function isValidLanguage(language: unknown): language is Language {
    return isString(language) && Object.values(Language).includes(language as Language);
}

export function isOptionalString(value: unknown, maxLength: number): boolean {
    return value === undefined || (typeof value === "string" && value.length <= maxLength);
}

export function isPositiveIntegerString(value: unknown): boolean {
    return isString(value) && parseInt(value) >= 1;
}

// CUID v1: starts with 'c', 25 chars total, lowercase alphanumeric
const cuidV1 = /^c[a-z0-9]{24}$/;
export function isValidCUID(value: unknown): boolean { 
  return isString(value) && cuidV1.test(value);
}

///// ----------------------------------- Tags

function validateTagValue(tag: unknown): ValidationError | null {
    if (!isString(tag) || tag === "") {
        return createError("Each tag should be a non-empty string");
    }
    if (tag.length > 50) {
        return createError("Each tag must be less than 50 characters");
    }
    if (/[\s,&A-Z]/.test(tag)) {
        return createError("Invalid character in tag");
    }
    return null;
}

export function validateTagsArray(tags: unknown): ValidationError | null {
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
                .map((tag) => tag.toLowerCase())
                .filter(Boolean)
        )
    );
}