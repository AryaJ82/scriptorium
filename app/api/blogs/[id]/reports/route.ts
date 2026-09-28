
import { NextRequest } from "next/server";
import prisma from "@/utils/client";
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { limitedAuthorSelect, type ReportPOSTBody } from "@/utils/interfaces";
import { verifyReportPOSTBody } from "@/utils/inputValidation/reportValidation";
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";
import { apiError, apiSuccess } from "@/utils/apiResponse";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }

            const { id } = await params;

            const body: ReportPOSTBody = await request.json();
            const error = verifyReportPOSTBody(body);
            if (error) {
                return apiError(error.message, error.status);
            }
            const { title, content } = body;

            if (!isPositiveIntegerString(id)) {
                return apiError("Blog post id is required", 400);
            }
            const blogPost = await prisma.blogPost.findUnique({ where: { id: parseInt(id) }, });
            if (!blogPost) {
                return apiError("Blog not found", 404);
            }

            const report = await prisma.blogReport.create({
                data: {
                    author: { connect: { id: user.id } },
                    blogPost: { connect: { id: blogPost.id } },
                    content: content,
                    title: title.trim(),
                },
                include: {
                    author: limitedAuthorSelect,
                    blogPost: true,
                },
            });

            return apiSuccess(report);
        } catch (error) {
            console.error("Error reporting blog", error);
            return apiError("Internal server error when reporting blog", 500);
        }
    })(request);
}