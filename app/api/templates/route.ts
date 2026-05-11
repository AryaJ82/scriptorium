
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse } from "next/server";
import prisma from "@/utils/client";
// import type { Language } frm "../execution/route";
import { Language } from "@/app/generated/prisma/enums";

interface TemplateQueryParams extends URLSearchParams {
    title?: string;
    language?: string;
    tags?: string;
    content?: string;
    author?: string;
    page?: string;
    pageSize?: string;
}
interface TemplatePOSTBody {
    title: string;
    code?: string;
    language: Language;
    description?: string;
    tags?: string[];
    forkedSourceId?: string;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        let error = verifyGETParams(searchParams as TemplateQueryParams);
        if (error) {
            return error;
        }
        const { title, tags, content, author, page, pageSize } = searchParams as TemplateQueryParams;


        const pageNum      = parseInt(page);
        const pageSizeNum  = parseInt(pageSize);
        const tagList      = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

        const where: Prisma.TemplateWhereInput = {
            ...(title && {
                title: { contains: title },
            }),
            ...(content && {
                code: { contains: content },
            }),
            ...(author && {
                author: {
                    is: { username: { equals: author } },
                },
            }),
            ...(tagList.length > 0 && {
                AND: tagList.map((tag) => ({
                    tags: { some: { name: tag } },
                })),
            }),
        };

       const [totalSize, templates] = await prisma.$transaction([
            prisma.template.count({ where }),
            prisma.template.findMany({
                where,
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
                            avatar: true,
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
                throw Error("User not loaded into request while editing profile")
            }
            let error = null;
            error = await verifyPOSTParams(body);
            if (error) {
                return error;
            }


            // TODO: Validate tags are an aray of strings, trim, remove empties, etc.
            const tagConnectOrCreate = tags?.map((tag) => ({
                where: { name: tag.toLowerCase().trim() },
                create: { name: tag.toLowerCase().trim() },
            }));

            const newTemplate = await prisma.template.create({
                data: {
                    title: title.trim(),
                    author: { connect: { id: user.id } },
                    ...(code && { code }),
                    language: language,
                    ...(description && { description }),
                    ...(tagConnectOrCreate && {
                        tags: {
                            connectOrCreate: tagConnectOrCreate,
                        },
                    }),
                    // Only set fork fields if a source ID was provided
                    ...(forkedSourceId && {
                        isForked: true,
                        parentTemplate: { connect: { id: forkedSourceId }, },
                    }),
                },
                include: {
                    tags: true,
                    parentTemplate: true,
                },
            });
            return NextResponse.json(newTemplate, { status: 201 });
        } catch (error) {
            console.error("Error when creating code template", error);
            return NextResponse.json({ error: "Internal server error when creating code template" }, { status: 500 });
        }
    })(request);
}

export async function DELETE(request: Request) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { template_id } = await request.json();
            if (!template_id) {
                return NextResponse.json({ error: "template_id is required" }, { status: 400 });
            }
            const { user } = request;
            if (!user) {
                throw Error("User not loaded into request while deleting template")
            }

            const template = await prisma.template.findUnique({ where: { id: template_id } });
            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            } else if (template.authorId !== user.id) {
                return NextResponse.json({ error: "Unauthorized to delete this template" }, { status: 403 });
            }

            await prisma.template.delete({ where: { id: template_id } });
            return NextResponse.json({ message: "Template deleted successfully" }, { status: 200 });
        } catch (error) {
            console.error("Error when deleting code template", error);
            return NextResponse.json({ error: "Internal server error when deleting code template" }, { status: 500 });
        }
    })(request);
}


function verifyGETParams(params: TemplateQueryParams) {
    const { title, tags, content, author, page, pageSize } = params;

    // --- Validation ---
    if (tags && !Array.isArray(tags)) {
        return NextResponse.json({ error: "Tags should be an array of strings" }, { status: 400 });
    } else if (tags) {
        for (const tag of tags) {
            if (typeof tag !== "string" || tag.trim() === "") {
                return NextResponse.json({ error: "Each tag should be a non-empty string" }, { status: 400 });
            }
        }
    }

    if (page && isNaN(parseInt(page))) {
        return NextResponse.json({ status: 400, error: "Page should be a number" }, { status: 400 });
    }
    if (pageSize && (!page || isNaN(parseInt(pageSize)))) {
        return NextResponse.json({ status: 400, error: "Page size should be a number" });
    }
    if (content && typeof content !== "string") {
        return NextResponse.json({ status: 400, error: "Content should be a string" });
    }
    if (author && typeof author !== "string") {
        return NextResponse.json({ status: 400, error: "Author should be a string" });
    }
    if (!page || !pageSize) {
        return NextResponse.json({ error: "Please provide page and page size" }, { status: 400 });
    }
}

async function verifyPOSTParams(body: TemplatePOSTBody) {
    const { title, code, description, language, tags, forkedSourceId } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
        return NextResponse.json({ error: "Please provide a title" }, { status: 400 });
    }

    if (code && (typeof code !== "string")) {
        return NextResponse.json({ error: "Please provide code" }, { status: 400 });
    }

    if (tags && !Array.isArray(tags)) {
        return NextResponse.json({ error: "Tags should be an array of strings" }, { status: 400 });
    } else if (tags) {
        for (const tag of tags) {
            if (typeof tag !== "string" || tag.trim() === "") {
                return NextResponse.json({ error: "Each tag should be a non-empty string" }, { status: 400 });
            }
        }
    }

    if (!language || !(language in Language)) {
        return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    if (description && (typeof description !== "string")) {
        return NextResponse.json({ error: "Description should be a non-empty string" }, { status: 400 });
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