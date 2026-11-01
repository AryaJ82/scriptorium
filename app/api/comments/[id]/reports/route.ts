
import { NextRequest } from "next/server";
import prisma from "@/utils/client";
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { limitedAuthorSelect, type ReportPOSTBody } from "@/utils/interfaces";
import { verifyReportPOSTBody } from "@/utils/inputValidation/reportValidation";
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { publicCommentWhere } from "@/utils/contentVisibility";

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
                return apiError("Comment id is required", 400);
            }
            const comment = await prisma.comment.findFirst({
                where: { id: parseInt(id), ...publicCommentWhere() },
            });
            if (!comment) {
                return apiError("Comment not found", 404);
            }

            const report = await prisma.commentReport.create({
                data: {
                    author: { connect: { id: user.id } },
                    comment: { connect: { id: comment.id } },
                    content: content,
                    title: title.trim(),
                },
                include: {
                    author: limitedAuthorSelect,
                    comment: true,
                },
            });

            return apiSuccess(report);
        } catch (error) {
            console.error("Error reporting comment", error);
            return apiError("Internal server error when reporting comment", 500);
        }
    })(request);
}