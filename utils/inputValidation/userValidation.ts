import { UserProfilePATCHBody, ValidationError } from "../interfaces";
import { createError, isOptionalString, MAX_PASSWORD_LENGTH, MAX_USERNAME_LENGTH } from "./generalValidation";


//// ------------------------------------- Username and password

export function verifyPassword(password: unknown): ValidationError | null {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1 special character
    if (!password || typeof password !== "string") {
        return createError("Invalid password: must be a string");
    } else if (password.length < 8 || password.length > MAX_PASSWORD_LENGTH) {
        return createError(`Invalid password: must be between 8 and ${MAX_PASSWORD_LENGTH} characters`);
    } else if (!/[A-Z]/.test(password)) {
        return createError("Invalid password: must contain at least one uppercase letter");
    } else if (!/[a-z]/.test(password)) {
        return createError("Invalid password: must contain at least one lowercase letter");
    } else if (!/[0-9]/.test(password)) {
        return createError("Invalid password: must contain at least one digit");
    } else if (!/[@$!%*?&]/.test(password)) {
        return createError("Invalid password: must contain at least one special character");
    } else {
        return null;
    }
}

export function verifyUsername(username: unknown): ValidationError | null {
    if (!username || typeof username !== "string") {
        return createError("Invalid username: must be a string");
    } else if (!/[@$!%*?&]/.test(username)) {
        return createError("Invalid username: must not contain special characters");
    } else if (username.length < 3 || username.length > MAX_USERNAME_LENGTH) {
        return createError(`Invalid username: must be between 3 and ${MAX_USERNAME_LENGTH} characters`);
    } else {
        return null;
    }
}


//// -------------------------------------------- Patch

export function verifyUserProfilePATCHBody(params: UserProfilePATCHBody) : ValidationError | null  {
    const { email, firstName, lastName, avatarUrl, phoneNumber } = params;

    if (!isOptionalString(firstName, 30)) {
        return createError(`Invalid first name: must be a string less than 30 characters`);
    }

    if (!isOptionalString(lastName, 30)) {
        return createError(`Invalid last name: must be a string less than 30 characters`);
    }

    if (!isOptionalString(avatarUrl, 2048)) {
        return createError(`Invalid avatar URL: must be a string less than 2048 characters`);
    } else if (avatarUrl && !/^https?:\/\/.+\..+/.test(avatarUrl)) {
        return createError("Invalid avatar URL: must be a valid URL");
    }

    if (!isOptionalString(phoneNumber, 20)) {
        return createError("Invalid phone number: must be a string less than 20 characters");
    } else if (phoneNumber && !/^\+?[0-9\s\-()]+$/.test(phoneNumber)) {
        return createError("Invalid phone number: must be a valid phone number");
    }

    if (!isOptionalString(email, 254)) {
        return createError("Invalid email: must be a string less than 254 characters");
    } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return createError("Invalid email: must be a valid email address");
    }

    return null;
}