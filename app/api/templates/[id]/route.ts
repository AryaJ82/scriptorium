
import { AuthenticatedRequest, withAuth, getOptionalUser } from "@/utils/middlewareAuth";
import { NextRequest } from "next/server";
import prisma from "@/utils/client";
import { normalizeTags, verifyTemplatePATCHBody } from "@/utils/inputValidation/templateValidation";
import type { TemplatePATCHBody } from "@/utils/interfaces";
import { isValidCUID } from "@/utils/inputValidation/generalValidation";
import { templateGetInclude } from "@/utils/interfaces";
import { apiError, apiSuccess } from "@/utils/apiResponse";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!isValidCUID(id)) {
            return apiError("Invalid template cuid", 400);
        }

        const currentUser = await getOptionalUser(request);

        const template = await prisma.template.findUnique({
            where: { id: id },
            ...templateGetInclude({ currentUserId: currentUser?.id })
        });

        if (!template) {
            return apiError("Template not found", 404);
        }

        return apiSuccess(template);

    } catch (error) {
        console.error("Error fetching templates at [id] route", error);
        return apiError("Internal server error when fetching templates at [id] route", 500);
    }
}


export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }

            const body: TemplatePATCHBody = await request.json();
            const patchValidationError = verifyTemplatePATCHBody(body);
            if (patchValidationError) {
                return apiError(patchValidationError.message, patchValidationError.status ?? 400);
            }
            const { title, code, stdin, language, description, tags } = body;

            const { id } = await params;
            if (!isValidCUID(id)) {
                return apiError("Invalid template id", 400);
            }

            const template = await prisma.template.findUnique({ where: { id: id } });
            if (!template) {
                return apiError("Template not found", 404);
            } else if (template.authorId !== user.id) {
                return apiError("Unauthorized", 401);
            }

            const tagConnectOrCreate = tags !== undefined ? normalizeTags(tags).map((tag) => ({
                where: { name: tag },
                create: { name: tag },
            })) : undefined;

            const updatedTemplate = await prisma.template.update({
                where: { id: id },
                data: {
                    ...(title !== undefined && { title: title.trim() }),
                    ...(code !== undefined && { code }),
                    ...(stdin !== undefined && { stdin }),
                    ...(language !== undefined && { language }),
                    ...(description !== undefined && { description }),
                    ...(tagConnectOrCreate !== undefined && {
                        tags: {
                            set: [],
                            connectOrCreate: tagConnectOrCreate,
                        },
                    }),
                },
                ...templateGetInclude({ currentUserId: user.id }),
            });

            return apiSuccess(updatedTemplate);
        } catch (error) {
            console.error("Error when updating code template:", error);
            return apiError("Internal server error when updating code template", 500);
        }
    })(request);
}


export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }

            const { id } = await params;
            if (!isValidCUID(id)) {
                return apiError("template_id is required and must be a string", 400);
            }

            const template = await prisma.template.findUnique({
                where: { id: id },
                include: { descendentTemplates: true },
            });
            if (!template) {
                return apiError("Template not found", 404);
            }
            if (template.authorId !== user.id) {
                return apiError("Forbidden", 403);
            }

            // Check if there are forked templates
            if (template.descendentTemplates.length > 0) {
                return apiError("Cannot delete template that has been forked. Consider archiving instead.", 409);
            }

            await prisma.template.delete({ where: { id: id } });
            return apiSuccess({ message: "Template deleted successfully" });
        } catch (error) {
            console.error("Error when deleting code template", error);
            return apiError("Internal server error when deleting code template", 500);
        }
    })(request);
}
