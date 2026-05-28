
import type { ValidationError, ReportPOSTBody } from "../interfaces";
import { isString, createError, MAX_TITLE_LENGTH, MAX_CONTENT_LENGTH } from "@/utils/inputValidation/generalValidation";

export function verifyReportPOSTBody(params: ReportPOSTBody): ValidationError | null {
    const { content, title } = params;

    if (title === undefined || !isString(title) || title.trim() === "") {
        return createError("Invalid report title");
    } else if (title.length > MAX_TITLE_LENGTH) {
        return createError(`title should be a string with at most ${MAX_TITLE_LENGTH} characters`);
    }

    if (content === undefined || !isString(content) || content.trim() === "") {
        return createError("Invalid report content");
    } else if (content.length > MAX_CONTENT_LENGTH) {
        return createError(`report content must be less than ${MAX_CONTENT_LENGTH} characters`);
    }

    return null;
}

