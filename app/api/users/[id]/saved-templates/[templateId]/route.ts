import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/client";
import { isValidCUID } from "@/utils/inputValidation/generalValidation";
import { templateGetInclude } from "@/utils/interfaces";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; templateId: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { id, templateId } = await params;
            const { user } = request;
            if (!user || id !== user.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            if (!isValidCUID(templateId)) {
                return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
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
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }

            const updatedTemplate = await prisma.template.update({
                where: { id: template.id },
                data: template.savers.length ? { savers: { disconnect: { id: user.id } } } : {},
                ...templateGetInclude({ currentUserId: user.id })
            });

            return NextResponse.json({
                message: "Template unsaved successfully",
                data: updatedTemplate
            });

        } catch (error) {
            console.error("Error unsaving template", error);
            return NextResponse.json({ error: "An error occurred while unsaving the template" }, { status: 500 });
        }
    })(request);
}

