
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client";
import { Language } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { templateSearch, verifyGETParams } from "@/utils/templateSearch";
import { normalizeTags, verifyPOSTParams } from "@/utils/inputValidation/templateValidation";
import type { TemplateGETQuery, TemplatePOSTBody } from "@/utils/interfaces";
import { limitedAuthorSelect } from "@/utils/interfaces";


export async function GET(request: NextRequest) {
    try {
        // const { searchParams } = (new URL(request.url));
        // const queryParams = Object.fromEntries(searchParams) as unknown as TemplateGETQuery;
        const queryParams = request.nextUrl.searchParams as TemplateGETQuery;

        let error = verifyGETParams(queryParams);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
        }
        const { template_id, title, language, content, tags, author, page, pageSize, sortBy, sortOrder } = queryParams;
        // Get tags as array of strings from comma separation tags=tag1,tag2,...
        const tagList = normalizeTags(tags?.split(','));


        const pageNum = page ? parseInt(page) : 1;
        const pageSizeNum = pageSize ? parseInt(pageSize) : 10;

        const where: Prisma.TemplateWhereInput = {
            ...(template_id && {
                id: template_id
            }),
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
            ...(tagList.length > 0 && {
                AND: tagList.map((tag) => ({
                    tags: { some: { name: { equals: tag } } },
                })),
            }),
        };

        const orderBy = {
            [sortBy ?? "createdAt"]: (sortOrder === 'desc') ? 'desc' : 'asc',
        } as Prisma.TemplateOrderByWithRelationInput;

        const searchResult = await templateSearch(where, orderBy, pageNum, pageSizeNum);
        return NextResponse.json(searchResult, { status: 200 });

    } catch (error) {
        console.error("Error fetching templates", error);
        return NextResponse.json({ error: "Internal server error when fetching templates" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
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
                            author: limitedAuthorSelect,
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


