
import { ValidationError } from "@/utils/interfaces";
import { Language } from "@/utils/interfaces";




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
    return value === undefined || (isString(value) && value.length <= maxLength);
}

export function isPositiveIntegerString(value: unknown): boolean {
    return isString(value) && /^\d+$/.test(value) && Number(value) >= 1;
}

// CUID v1: starts with 'c', 25 chars total, lowercase alphanumeric
const cuidV1 = /^c[a-z0-9]{24}$/;
export function isValidCUID(value: unknown): boolean { 
  return isString(value) && cuidV1.test(value);
}

//// ------------------------------------- Username and password

export function verifyPassword(password: unknown): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1 special character
    if(!password || typeof password !== "string" || password.length < 8 || password.length > 100) {
        return false;
    } else if (!/[A-Z]/.test(password)) {
        return false;
    } else if (!/[a-z]/.test(password)) {
        return false;
    } else if (!/[0-9]/.test(password)) {
        return false;
    } else if (!/[@$!%*?&]/.test(password)) {
        return false;
    } else {
        return true;
    }
}

export function verifyUsername(username: unknown): boolean {
    if(!username || typeof username !== "string" || username.length < 3 || username.length > 20) {
        return false;
    } else {
        return true;
    }
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