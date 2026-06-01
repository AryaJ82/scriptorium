
import { ExecutionRequestPOSTBody, LANG_CONFIG, ValidationError } from "../interfaces";
import { createError } from "./generalValidation";

import { MAX_CODE_SIZE, MAX_STDIN_SIZE } from "@/utils/inputValidation/generalValidation";

export function validateExecutionPOSTBody(body: ExecutionRequestPOSTBody): ValidationError | null {
    const { language, code, stdin } = body;
    if (!language || !(language in LANG_CONFIG)) {
        return createError("Unsupported language");
    } else if (!code) {
        return createError("Code is required");
    } else if (Buffer.byteLength(code) > MAX_CODE_SIZE) {
        return createError("Code exceeds maximum size");
    } else if (stdin && Buffer.byteLength(stdin) > MAX_STDIN_SIZE) {
        return createError("Stdin exceeds maximum size");
    }
    return null;
}