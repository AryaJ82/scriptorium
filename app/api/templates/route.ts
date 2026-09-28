
import { AuthenticatedRequest, withAuth, getOptionalUser } from "@/utils/middlewareAuth";
import { NextRequest } from "next/server";
import prisma from "@/utils/client";
import { Language } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { templateSearch, verifyGETParams } from "@/utils/templateSearch";
import { normalizeTags, verifyTemplatePOSTBody } from "@/utils/inputValidation/templateValidation";
import type { TemplateGETQuery, TemplatePOSTBody } from "@/utils/interfaces";
import { templateGetInclude } from "@/utils/interfaces";
import { apiError, apiSuccess } from "@/utils/apiResponse";


export async function GET(request: NextRequest) {
    try {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams) as TemplateGETQuery;

        const error = verifyGETParams(queryParams);
        if (error) {
            return apiError(error.message, error.status ?? 400);
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

        const currentUser = await getOptionalUser(request);
        const searchResult = await templateSearch(where, orderBy, pageNum, pageSizeNum, currentUser?.id ?? undefined);
        return apiSuccess(searchResult.templates, 200, searchResult.pagination);

    } catch (error) {
        console.error("Error fetching templates", error);
        return apiError("Internal server error when fetching templates", 500);
    }
}

export async function POST(request: NextRequest) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }
            
            const body: TemplatePOSTBody = await request.json();
            const postValidationError = await verifyTemplatePOSTBody(body);
            if (postValidationError) {
                return apiError(postValidationError.message, postValidationError.status ?? 400);
            }
            const { title, code, stdin, language, description, tags, forkedSourceId } = body;

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
                    ...(stdin && { stdin }),
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
                ...templateGetInclude({}),
            });
            return apiSuccess(newTemplate, 201);
        } catch (error) {
            console.error("Error when creating code template", error);
            return apiError("Internal server error when creating code template", 500);
        }
    })(request);
}


