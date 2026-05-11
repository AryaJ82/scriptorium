import jwt from "jsonwebtoken"

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "whateverstring";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "someotherstring";
const REFRESH_TOKEN_EXPIRY = "1week";
const ACCESS_TOKEN_EXPIRY = "1h";

/**
 * Generates a JWT access token with the given payload.
 * @param {object} payload - The payload to include in the token.
 * @returns {string} - The generated JWT access token.
 */
export function generateAccessToken(payload: { userId: string, userRole: string }) {
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}


/**
* Generates a JWT refresh token with the given payload.
* @param {object} payload - The payload to include in the token.
* @returns {string} - The generated JWT refresh token.
*/
export function generateRefreshToken(payload: { userId: string, userRole: string }) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
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
        throw error;
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
        throw error;
    }
}