
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse } from "next/server";
import prisma from "@/utils/client";
// import type { Language } frm "../execution/route";
import { Language } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { templateSearch, verifyGETParams } from "@/utils/templateSearch";
import { normalizeTags, verifyPATCHParams, verifyPOSTParams } from "@/utils/templateValidation";
import type { TemplateGETQuery } from "@/utils/templateSearch";

interface TemplatePOSTBody {
    title: string;
    code?: string;
    language: Language;
    description?: string;
    tags?: string[];
    forkedSourceId?: string;
}

interface TemplatePATCHBody {
    template_id: string;
    title?: string;
    code?: string;
    language?: Language;
    description?: string;
    tags?: string[];
}

export async function GET(request: Request) {
    try {
        const { searchParams } = (new URL(request.url));
        const queryParams = Object.fromEntries(searchParams) as unknown as TemplateGETQuery;

        let error = verifyGETParams(queryParams);
        if (error) {
            return error;
        }
        const { title, language, content, tags, author, page, pageSize, sortBy, sortOrder } = queryParams;
        // Get tags as array of strings from comma separation tags=tag1,tag2,...
        const tagList = normalizeTags(tags?.split(','));
        

        const pageNum = page ? parseInt(page) : 1;
        const pageSizeNum = pageSize ? parseInt(pageSize) : 10;

        const where: Prisma.TemplateWhereInput = {
            ...(title && {
                title: { contains: title },
            }),
            ...(language && {
                language: { equals: language as Language },
            }),
            ...(content && {
                OR: [
                    { description: { contains: content, } },
                    { code: { contains: content, } },
                ],
            }),
            ...(author && {
                author: {
                    is: { username: { equals: author } },
                },
            }),
            // ...(tags && {
            //     tags: {
            //         some: { name: { equals: tags } },
            //     },
            // }),
            ...(tagList.length > 0 && {
                AND: tagList.map((tag) => ({
                    tags: { some: { name: { equals: tag } } },
                })),
        }),
    };

    const orderBy: Prisma.TemplateOrderByWithRelationInput = {};
    orderBy[sortBy ? sortBy : "createdAt"] = (sortOrder === 'desc') ? 'desc' : 'asc';

    return await templateSearch(where, orderBy, pageNum, pageSizeNum);

} catch (error) {
    console.error("Error fetching templates", error);
    return NextResponse.json({ error: "Internal server error when fetching templates" }, { status: 500 });
}
}

export async function POST(request: Request) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const body: TemplatePOSTBody = await request.json();
            const { title, code, language, description, tags, forkedSourceId } = body;
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const postValidationError = await verifyPOSTParams(body);
            if (postValidationError) {
                return NextResponse.json({ error: postValidationError.message }, { status: postValidationError.status ?? 400 });
            }

            const uniqueTags = normalizeTags(tags);
            const tagConnectOrCreate = uniqueTags.map((tag) => ({
                where: { name: tag },
                create: { name: tag },
            }));

            const newTemplate = await prisma.template.create({
                data: {
                    title: title.trim(),
                    author: { connect: { id: user.id } },
                    ...(code && { code }),
                    language: language,
                    ...(description && { description: description.trim() }),
                    ...(tagConnectOrCreate.length > 0 && {
                        tags: {
                            connectOrCreate: tagConnectOrCreate,
                        },
                    }),
                    // Only set fork fields if a source ID was provided
                    ...(forkedSourceId && {
                        isForked: true,
                        parentTemplate: { connect: { id: forkedSourceId } },
                    }),
                },
                include: {
                    tags: true,
                    parentTemplate: {
                        select: {
                            id: true,
                            title: true,
                            author: { select: { username: true } },
                        },
                    },
                },
            });
            return NextResponse.json(newTemplate, { status: 201 });
        } catch (error) {
            console.error("Error when creating code template", error);
            return NextResponse.json({ error: "Internal server error when creating code template" }, { status: 500 });
        }
    })(request);
}

export async function PATCH(request: Request) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const body: TemplatePATCHBody = await request.json();
            const { template_id, title, code, language, description, tags } = body;
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const patchValidationError = await verifyPATCHParams(body);
            if (patchValidationError) {
                return NextResponse.json({ error: patchValidationError.message }, { status: patchValidationError.status ?? 400 });
            }

            // --- Authorization ---
            const template = await prisma.template.findUnique({ where: { id: template_id } });
            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }
            if (template.authorId !== user.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            // --- Tag handling ---
            const tagConnectOrCreate = tags !== undefined ? normalizeTags(tags).map((tag) => ({
                where: { name: tag },
                create: { name: tag },
            })) : undefined;

            const updatedTemplate = await prisma.template.update({
                where: { id: template_id },
                data: {
                    ...(title && { title: title.trim() }),
                    ...(code && { code }),
                    ...(language && { language }),
                    ...(description && { description }),
                    ...(tagConnectOrCreate !== undefined && {
                        tags: {
                            set: [],
                            connectOrCreate: tagConnectOrCreate,
                        },
                    }),
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    language: true,
                    code: true,
                    isForked: true,
                    createdAt: true,
                    tags: {
                        select: { name: true },
                    },
                    author: {
                        select: {
                            username: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatarUrl: true,
                            role: true,
                            createdAt: true,
                        },
                    },
                },
            });

            return NextResponse.json({ template: updatedTemplate }, { status: 200 });
        } catch (error) {
            console.error("Error when updating code template:", error);
            return NextResponse.json({ error: "Internal server error when updating code template" }, { status: 500 });
        }
    })(request);
}

export async function DELETE(request: Request) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { template_id } = await request.json();
            if (!template_id || typeof template_id !== "string") {
                return NextResponse.json({ error: "template_id is required and must be a string" }, { status: 400 });
            }
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const template = await prisma.template.findUnique({
                where: { id: template_id },
                include: { descendentTemplates: true },
            });
            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }
            if (template.authorId !== user.id) {
                return NextResponse.json({ error: "Unauthorized to delete this template" }, { status: 403 });
            }

            // Check if there are forked templates
            if (template.descendentTemplates.length > 0) {
                return NextResponse.json({
                    error: "Cannot delete template that has been forked. Consider archiving instead."
                }, { status: 409 });
            }

            await prisma.template.delete({ where: { id: template_id } });
            return NextResponse.json({ message: "Template deleted successfully" }, { status: 200 });
        } catch (error) {
            console.error("Error when deleting code template", error);
            return NextResponse.json({ error: "Internal server error when deleting code template" }, { status: 500 });
        }
    })(request);
}


