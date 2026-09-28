import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextRequest } from "next/server";
import prisma from "@/utils/client";
import { isValidCUID } from "@/utils/inputValidation/generalValidation";
import { templateGetInclude } from "@/utils/interfaces";
import { apiError, apiSuccess } from "@/utils/apiResponse";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; templateId: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { id, templateId } = await params;
            const { user } = request;
            if (!user || id !== user.id) {
                return apiError("Unauthorized", 401);
            }

            if (!isValidCUID(templateId)) {
                return apiError("Template ID is required", 400);
            }

            const template = await prisma.template.findUnique({
                where: { id: templateId },
                select: {
                    id: true,
                    savers: {
                        where: { id: user.id },
                        select: { id: true }
                    }
                }
            });

            if (!template) {
                return apiError("Template not found", 404);
            }

            const updatedTemplate = await prisma.template.update({
                where: { id: template.id },
                data: template.savers.length ? { savers: { disconnect: { id: user.id } } } : {},
                ...templateGetInclude({ currentUserId: user.id })
            });

            return apiSuccess(updatedTemplate);

        } catch (error) {
            console.error("Error unsaving template", error);
            return apiError("An error occurred while unsaving the template", 500);
        }
    })(request);
}

