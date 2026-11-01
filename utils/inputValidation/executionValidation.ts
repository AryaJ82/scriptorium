
import type { ExecutionRequestPOSTBody, ValidationError } from "../interfaces";
import { LANG_CONFIG } from "../interfaces";
import { createError } from "./generalValidation";

import { MAX_CODE_SIZE, MAX_STDIN_SIZE } from "@/utils/inputValidation/generalValidation";

export type ExecutionRequestValidationResult =
    | { success: true; data: ExecutionRequestPOSTBody }
    | { success: false; error: ValidationError };

function isSupportedLanguage(value: string): value is ExecutionRequestPOSTBody["language"] {
    return Object.hasOwn(LANG_CONFIG, value);
}

export function validateExecutionPOSTBody(body: unknown): ExecutionRequestValidationResult {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return { success: false, error: createError("Request body must be an object") };
    }

    const candidate = body as Record<string, unknown>;
    const { language, code, stdin } = candidate;
    if (typeof language !== "string" || !isSupportedLanguage(language)) {
        return { success: false, error: createError("Unsupported language") };
    }
    if (typeof code !== "string") {
        return { success: false, error: createError("Code must be a string") };
    }
    if (!code) {
        return { success: false, error: createError("Code is required") };
    }
    if (Buffer.byteLength(code) > MAX_CODE_SIZE) {
        return { success: false, error: createError("Code exceeds maximum size") };
    }
    if (stdin !== undefined && typeof stdin !== "string") {
        return { success: false, error: createError("Stdin must be a string") };
    }
    if (typeof stdin === "string" && Buffer.byteLength(stdin) > MAX_STDIN_SIZE) {
        return { success: false, error: createError("Stdin exceeds maximum size") };
    }

    return {
        success: true,
        data: {
            language,
            code,
            ...(stdin !== undefined ? { stdin } : {}),
        },
    };
}