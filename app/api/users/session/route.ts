import { NextResponse, NextRequest } from "next/server";
import { withAuth } from "@/utils/middlewareAuth";
import type { AuthenticatedRequest } from "@/utils/middlewareAuth";

export async function GET(request: NextRequest) {
  return withAuth(async (request: AuthenticatedRequest) => {
    const user = request.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      message: "Protected session data is available.",
      user: {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  })(request);
}
