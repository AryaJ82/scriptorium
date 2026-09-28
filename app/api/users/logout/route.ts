import { withAuth } from "@/utils/middlewareAuth";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/utils/apiResponse";

export async function GET(request: NextRequest) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return withAuth(async (request: NextRequest) => {
        try {
            // Note: JTI not implemented because It's not required and I'm too burnt out to be bothered
            const response = apiSuccess({ message: "Logout successful" });
            response.cookies.set("accessToken", "", {
                httpOnly: true,
                path: "/",
                sameSite: "strict",
                maxAge: -1
            });
            response.cookies.set("refreshToken", "", {
                httpOnly: true,
                path: "/api/users/refresh",
                sameSite: "strict",
                maxAge: -1
            });
            return response;
        } catch (error) {
            console.error("Error during logout:", error);
            return apiError("An error occurred while processing the request", 500);
        }
    })(request);
}