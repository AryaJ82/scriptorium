import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth"
import { NextResponse, NextRequest } from "next/server"
import prisma from "@/utils/client"
import { Language } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { templateSearch, verifyGETParams, normalizeTags } from "@/utils/templateSearch";
import { type TemplateGETQuery, type SavedTemplateTogglePATCHBody, templateGetInclude } from "@/utils/interfaces";
import { isValidCUID } from "@/utils/inputValidation/generalValidation";



export async function GET(request: NextRequest) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const queryParams = request.nextUrl.searchParams as TemplateGETQuery;

            const error = verifyGETParams(queryParams);
            if (error) {
                return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
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
            return NextResponse.json(searchResult, { status: 200 });

        } catch (error) {
            console.error("Error fetching saved templates", error);
            return NextResponse.json({ error: "An error occurred while fetching the saved templates" }, { status: 500 });
        }
    })(request);
}


export async function PATCH(request: NextRequest) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const body: SavedTemplateTogglePATCHBody = await request.json();
            const { template_id, unsave } = body;

            if (!isValidCUID(template_id)) {
                return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
            }

            const shouldUnsave = unsave === true;

            // save by default, unsave if unsave is true
            const prop = shouldUnsave ? { disconnect: { id: user.id } } : { connect: { id: user.id } };

            const template = await prisma.template.update({
                where: { id: template_id },
                data: { savers: prop },
                ...templateGetInclude({ currentUserId: user.id })
            });
            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }

            return NextResponse.json({
                message: shouldUnsave ? "Template unsaved successfully" : "Template saved successfully",
                template: template
            });

        } catch (error) {
            console.error("Error saving template", error);
            return NextResponse.json({ error: "An error occurred while saving the template" }, { status: 500 });
        }
    })(request);
}