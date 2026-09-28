import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth"
import { NextRequest } from "next/server"
import prisma from "@/utils/client"
import { Language } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { templateSearch, verifyGETParams, normalizeTags } from "@/utils/templateSearch";
import { type TemplateGETQuery, type SavedTemplateTogglePOSTBody, templateGetInclude } from "@/utils/interfaces";
import { isValidCUID } from "@/utils/inputValidation/generalValidation";
import { apiError, apiSuccess } from "@/utils/apiResponse";



export async function GET(request: NextRequest) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }
            const queryParams = Object.fromEntries(request.nextUrl.searchParams) as TemplateGETQuery;

            const error = verifyGETParams(queryParams);
            if (error) {
                return apiError(error.message, error.status ?? 400);
            }
            const { template_id, title, language, content, tags, author, page, pageSize, sortBy, sortOrder } = queryParams;

            const tagList = normalizeTags(tags?.split(','));
            const pageNum = page ? parseInt(page) : 1;
            const pageSizeNum = pageSize ? parseInt(pageSize) : 10;

            const where: Prisma.TemplateWhereInput = {
                // Scope to only this user's saved templates
                ...(template_id && {
                    id: template_id
                }),
                savers: { // Template.savers User[] @relation(...) is a model field
                    some: { id: user.id },
                },
                ...(title && {
                    title: { contains: title },
                }),
                ...(language && {
                    language: { equals: language as Language },
                }),
                ...(content && {
                    OR: [
                        { description: { contains: content } },
                        { code: { contains: content } },
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

            const searchResult = await templateSearch(where, orderBy, pageNum, pageSizeNum, user.id ?? undefined);
            return apiSuccess(searchResult.templates, 200, searchResult.pagination);

        } catch (error) {
            console.error("Error fetching saved templates", error);
            return apiError("An error occurred while fetching the saved templates", 500);
        }
    })(request);
}


export async function POST(request: NextRequest) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return apiError("Unauthorized", 401);
            }

            const body: SavedTemplateTogglePOSTBody = await request.json();
            const { template_id } = body;

            if (!isValidCUID(template_id)) {
                return apiError("Template ID is required", 400);
            }

            const updatedTemplate = await prisma.template.update({
                where: { id: template_id },
                data: { savers: { connect: { id: user.id } } },
                ...templateGetInclude({ currentUserId: user.id })
            });
            if (!updatedTemplate) {
                return apiError("Template not found", 404);
            }

            return apiSuccess(updatedTemplate);

        } catch (error) {
            console.error("Error saving template", error);
            return apiError("An error occurred while saving the template", 500);
        }
    })(request);
}
