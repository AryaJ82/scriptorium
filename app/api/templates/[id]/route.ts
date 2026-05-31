
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client";
import { normalizeTags, verifyTemplatePATCHBody } from "@/utils/inputValidation/templateValidation";
import type { TemplatePATCHBody } from "@/utils/interfaces";
import { isValidCUID } from "@/utils/inputValidation/generalValidation";
import { limitedAuthorSelect } from "@/utils/interfaces";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!isValidCUID(id)) {
            return NextResponse.json({ error: "Invalid template cuid" }, { status: 400 });
        }

        const template = await prisma.template.findUnique({
            where: { id: id },
            include: {
                author: limitedAuthorSelect,
                tags: { select: { name: true }, },
                parentTemplate: {
                    select: {
                        id: true,
                        author: limitedAuthorSelect,
                        title: true,
                        createdAt: true,
                    },
                },
                replies: true,
            },
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json({ template }, { status: 200 });

    } catch (error) {
        console.error("Error fetching templates at [id] route", error);
        return NextResponse.json({ error: "Internal server error when fetching templates at [id] route" }, { status: 500 });
    }
}


export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const body: TemplatePATCHBody = await request.json();
            const patchValidationError = verifyTemplatePATCHBody(body);
            if (patchValidationError) {
                return NextResponse.json({ error: patchValidationError.message }, { status: patchValidationError.status ?? 400 });
            }
            const { title, code, stdin, language, description, tags } = body;

            const { id } = await params;
            if (!isValidCUID(id)) {
                return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
            }

            const template = await prisma.template.findUnique({ where: { id: id } });
            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            } else if (template.authorId !== user.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const tagConnectOrCreate = tags !== undefined ? normalizeTags(tags).map((tag) => ({
                where: { name: tag },
                create: { name: tag },
            })) : undefined;

            const updatedTemplate = await prisma.template.update({
                where: { id: id },
                data: {
                    ...(title && { title: title.trim() }),
                    ...(code && { code }),
                    ...(stdin && { stdin }),
                    ...(language && { language }),
                    ...(description && { description }),
                    ...(tagConnectOrCreate !== undefined && {
                        tags: {
                            set: [],
                            connectOrCreate: tagConnectOrCreate,
                        },
                    }),
                },
                include: {
                    tags: {
                        select: { name: true },
                    },
                    author: limitedAuthorSelect,
                },
            });

            return NextResponse.json({ template: updatedTemplate }, { status: 200 });
        } catch (error) {
            console.error("Error when updating code template:", error);
            return NextResponse.json({ error: "Internal server error when updating code template" }, { status: 500 });
        }
    })(request);
}


export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;
            if (!isValidCUID(id)) {
                return NextResponse.json({ error: "template_id is required and must be a string" }, { status: 400 });
            }
            
            const template = await prisma.template.findUnique({
                where: { id: id },
                include: { descendentTemplates: true },
            });
            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }
            if (template.authorId !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            // Check if there are forked templates
            if (template.descendentTemplates.length > 0) {
                return NextResponse.json({
                    error: "Cannot delete template that has been forked. Consider archiving instead."
                }, { status: 409 });
            }

            await prisma.template.delete({ where: { id: id } });
            return NextResponse.json({ message: "Template deleted successfully" }, { status: 200 });
        } catch (error) {
            console.error("Error when deleting code template", error);
            return NextResponse.json({ error: "Internal server error when deleting code template" }, { status: 500 });
        }
    })(request);
}
