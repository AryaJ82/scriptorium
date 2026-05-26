import jwt from "jsonwebtoken"
import { NextResponse } from "next/server";

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "whateverstring";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "someotherstring";
const REFRESH_TOKEN_EXPIRY = "1week";
const ACCESS_TOKEN_EXPIRY = "1h";

/**
 * Generates a JWT access token with the given payload.
 * @param {object} payload - The payload to include in the token.
 * @returns {string} - The generated JWT access token.
 */
function generateAccessToken(payload: { user_id: string, user_role: string }) {
    if (!payload.user_id || !payload.user_role || typeof payload.user_id !== "string" || typeof payload.user_role !== "string") {
        throw Error("Invalid payload");
    }
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}


/**
* Generates a JWT refresh token with the given payload.
* @param {object} payload - The payload to include in the token.
* @returns {string} - The generated JWT refresh token.
*/
function generateRefreshToken(payload: { user_id: string, user_role: string }) {
    if (!payload.user_id || !payload.user_role || typeof payload.user_id !== "string" || typeof payload.user_role !== "string") {
        throw Error("Invalid payload");
    }
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function setAccessCookie(response: NextResponse, payload: { user_id: string, user_role: string }) {
    const accessToken = generateAccessToken(payload);
    response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        path: "/",
        sameSite: "strict",
        maxAge: 60 * 60 // 60 minutes
    });
}

export function setRefreshCookie(response: NextResponse, payload: { user_id: string, user_role: string }) {
    const refreshToken = generateRefreshToken(payload);
    response.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        path: "/api/users/refresh",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7 // 7 days
    });
}


/**
* Verifies a JWT from the Authorization header.
* @param {string} token - The JWT token to verify.
* @returns {jwt.JwtPayload | string} - The decoded token payload if valid, or null if invalid.
*/
export function verifyAccessToken(token: string): jwt.JwtPayload | string {
    try {
        return jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (error) {
        return "";
    }
}

/**
* Verifies a JWT from the Authorization header.
* @param {string} token - The JWT token to verify.
* @returns {jwt.JwtPayload | string} - The decoded token payload if valid, or null if invalid.
*/
export function verifyRefreshToken(token: string): jwt.JwtPayload | string {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        return "";
    }
}
