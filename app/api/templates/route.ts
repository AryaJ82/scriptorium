
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse } from "next/server";
import prisma from "@/utils/client";
// import type { Language } frm "../execution/route";
import { Language } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";

type ValidSortFields = 'title' | 'createdAt' | 'language';
const validSortFields = ['title', 'createdAt', 'language']
type ValidSortOrder = 'asc' | 'desc';
const validSortOrders = ['asc', 'desc'];
interface TemplateGETQuery {
    title?: string;
    language?: Language;
    tags?: string[];
    content?: string;
    author?: string;
    page?: string;
    pageSize?: string;
    sortBy?: ValidSortFields;
    sortOrder?: ValidSortOrder;
}
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
        const queryParams = Object.fromEntries(searchParams) as TemplateGETQuery;
        console.log(queryParams);


        let error = verifyGETParams(queryParams);
        if (error) {
            return error;
        }
        const { title, language, tags, content, author, page, pageSize, sortBy, sortOrder } = queryParams;

        const pageNum = page ? parseInt(page) : 1;
        const pageSizeNum = pageSize ? parseInt(pageSize) : 10;
        const tagList = tags ? tags.map((t) => t.trim().toLowerCase()).filter(Boolean) : [];

        const where: Prisma.TemplateWhereInput = {
            ...(title && {
                title: { contains: title },
            }),
            ...(language && {
                language: { equals: language.toUpperCase() as Language },
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
            ...(tagList.length > 0 && {
                AND: tagList.map((tag) => ({
                    tags: { some: { name: { equals: tag } } },
                })),
            }),
        };

        const orderBy: Prisma.TemplateOrderByWithRelationInput = {};
        if (sortBy) {
            if (validSortFields.includes(sortBy)) {
                orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
            }
        } else {
            orderBy.createdAt = 'desc'; // Default sort
        }

        const [totalSize, templates] = await prisma.$transaction([
            prisma.template.count({ where }),
            prisma.template.findMany({
                where,
                orderBy,
                skip: (pageNum - 1) * pageSizeNum,
                take: pageSizeNum,
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
            }),
        ]);

        return NextResponse.json({
            templates,
            pagination: {
                totalSize,
                totalPages: Math.ceil(totalSize / pageSizeNum),
                page: pageNum,
                pageSize: pageSizeNum,
            },
        }, { status: 200 });

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
            let error = await verifyPOSTParams(body);
            if (error) {
                return error;
            }

            // Validate and process tags
            const processedTags = tags?.map((tag) => tag.toLowerCase().trim()).filter(Boolean) || [];
            const uniqueTags = Array.from(new Set(processedTags)); // Remove duplicates

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

            if (!template_id) {
                return NextResponse.json({ error: "template_id is required" }, { status: 400 });
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
            const tagConnectOrCreate = tags?.map((tag) => ({
                where: { name: tag.toLowerCase().trim() },
                create: { name: tag.toLowerCase().trim() },
            }));

            const updatedTemplate = await prisma.template.update({
                where: { id: template_id },
                data: {
                    ...(title && { title: title.trim() }),
                    ...(code && { code }),
                    ...(language && { language }),
                    ...(description && { description }),
                    ...(tagConnectOrCreate && {
                        tags: {
                            // Disconnect all existing tags and reconnect with the new set
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


function verifyGETParams(params: TemplateGETQuery) {
    const { title, language, tags, content, author, page, pageSize, sortBy, sortOrder } = params;

    if (title && typeof title !== "string") {
        return NextResponse.json({ error: "Title should be a string" }, { status: 400 });
    }
    if (language && typeof language !== "string") {
        return NextResponse.json({ error: "Language should be a string" }, { status: 400 });
    }
    if (language && !(language in Language)) {
        return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }
    if (tags && typeof tags !== "string") {
        return NextResponse.json({ error: "Tags should be a comma-separated string" }, { status: 400 });
    }
    if (content && typeof content !== "string") {
        return NextResponse.json({ error: "Content should be a string" }, { status: 400 });
    }
    if (author && typeof author !== "string") {
        return NextResponse.json({ error: "Author should be a string" }, { status: 400 });
    }
    if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
        return NextResponse.json({ error: "Page should be a positive number" }, { status: 400 });
    }
    if (pageSize && (isNaN(parseInt(pageSize)) || parseInt(pageSize) < 1 || parseInt(pageSize) > 100)) {
        return NextResponse.json({ error: "Page size should be a number between 1 and 100" }, { status: 400 });
    }
    if (sortBy && !validSortFields.includes(sortBy)) {
        return NextResponse.json({ error: "SortBy should be a valid sort field" }, { status: 400 });
    }
    if (sortOrder && !validSortOrders.includes(sortOrder)) {
        return NextResponse.json({ error: "SortOrder should be 'asc' or 'desc'" }, { status: 400 });
    }
}

async function verifyPOSTParams(body: TemplatePOSTBody) {
    const { title, code, description, language, tags, forkedSourceId } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
        return NextResponse.json({ error: "Please provide a valid title" }, { status: 400 });
    }
    if (title.length > 255) {
        return NextResponse.json({ error: "Title must be less than 255 characters" }, { status: 400 });
    }

    if (code && typeof code !== "string") {
        return NextResponse.json({ error: "Code should be a string" }, { status: 400 });
    }

    if (tags && !Array.isArray(tags)) {
        return NextResponse.json({ error: "Tags should be an array of strings" }, { status: 400 });
    } else if (tags) {
        for (const tag of tags) {
            if (typeof tag !== "string" || tag.trim() === "") {
                return NextResponse.json({ error: "Each tag should be a non-empty string" }, { status: 400 });
            }
            if (tag.length > 50) {
                return NextResponse.json({ error: "Each tag must be less than 50 characters" }, { status: 400 });
            }
        }
    }

    if (!language || !(language in Language)) {
        return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    if (description && typeof description !== "string") {
        return NextResponse.json({ error: "Description should be a string" }, { status: 400 });
    }
    if (description && description.length > 1000) {
        return NextResponse.json({ error: "Description must be less than 1000 characters" }, { status: 400 });
    }

    if (forkedSourceId && typeof forkedSourceId !== "string") {
        return NextResponse.json({ error: "forkedSourceId should be a string if provided" }, { status: 400 });
    } else if (forkedSourceId) {
        const sourceTemplate = await prisma.template.findUnique({ where: { id: forkedSourceId } });
        if (!sourceTemplate) {
            return NextResponse.json({ error: "No template found to fork from with the provided forkedSourceId" }, { status: 400 });
        }
    }

    return null;
}