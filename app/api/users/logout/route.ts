import { withAuth } from "@/utils/middlewareAuth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    return withAuth(async (request: Request) => {
        try {
            const response = NextResponse.json({ message: "Logout successful" });
            response.cookies.set("accessToken", "", {
                httpOnly: true,
                path: "/",
                sameSite: "strict",
                maxAge: -1
            });
            response.cookies.set("refreshToken", "", {
                httpOnly: true,
                path: "/",
                sameSite: "strict",
                maxAge: -1
            });
            return response;
        } catch (error) {
            console.error("Error during logout:", error);
            return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 });
        }
    })(request);
}