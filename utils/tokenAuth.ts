import jwt from "jsonwebtoken"
import { NextResponse } from "next/server";

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "whateverstring";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "someotherstring";
const REFRESH_TOKEN_EXPIRY = !isNaN(Number(process.env.REFRESH_TOKEN_EXPIRY)) ? Number(process.env.REFRESH_TOKEN_EXPIRY)  *7*24*60*60 : 4*7*24*60*60; // "4 weeks"
const ACCESS_TOKEN_EXPIRY = !isNaN(Number(process.env.ACCESS_TOKEN_EXPIRY)) ? Number(process.env.ACCESS_TOKEN_EXPIRY) *60*60 : 10*60*60; // "10 h"


function generateAccessToken(payload: { user_id: string, user_role: string }) {
    if (!payload.user_id || !payload.user_role || typeof payload.user_id !== "string" || typeof payload.user_role !== "string") {
        throw Error("Invalid payload");
    }
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

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
        maxAge: ACCESS_TOKEN_EXPIRY // 60 minutes
    });
}

export function setRefreshCookie(response: NextResponse, payload: { user_id: string, user_role: string }) {
    const refreshToken = generateRefreshToken(payload);
    response.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        path: "/api/users/refresh",
        sameSite: "strict",
        maxAge: REFRESH_TOKEN_EXPIRY // 7 days
    });
}

export function verifyAccessToken(token: string): jwt.JwtPayload | string {
    try {
        return jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (error) {
        return "";
    }
}

export function verifyRefreshToken(token: string): jwt.JwtPayload | string {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        return "";
    }
}
