import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth"
import { NextResponse, NextRequest } from "next/server"
import prisma from "@/utils/client"
import { Language } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { templateSearch, verifyGETParams, normalizeTags } from "@/utils/templateSearch";
import type { TemplateGETQuery, SavedTemplateTogglePATCHBody } from "@/utils/interfaces";
import { isValidCUID } from "@/utils/inputValidation/generalValidation";



export async function GET(request: NextRequest) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const { searchParams } = (new URL(request.url));
            const queryParams = Object.fromEntries(searchParams) as unknown as TemplateGETQuery;

            let error = verifyGETParams(queryParams);
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
                // ...(tag && {
                //     tags: {
                //         some: { name: { equals: tag } },
                //     },
                // }),
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
            console.error("Error fetching saved templates", error);
            return NextResponse.json({ error: "An error occurred while fetching the saved templates" }, { status: 500 });
        }
    })(request);
}


export async function PATCH(request: NextRequest) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            const body: SavedTemplateTogglePATCHBody = await request.json();
            const { template_id, unsave } = body;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (!isValidCUID(template_id)) {
                return NextResponse.json({ error: "Template ID is required" }, { status: 400 });

            }

            const template = await prisma.template.findUnique({
                where: { id: template_id },
            });

            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }

            const shouldUnsave = unsave === true;

            // save by default, unsave if unsave is true
            const prop = shouldUnsave ? { disconnect: { id: template_id } } : { connect: { id: template_id } };

            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { savedTemplates: prop },
                select: {
                    username: true,
                    savedTemplates: true
                }
            });

            return NextResponse.json({
                message: shouldUnsave ? "Template unsaved successfully" : "Template saved successfully",
                user: updatedUser
            });

        } catch (error) {
            console.error("Error saving template", error);
            return NextResponse.json({ error: "An error occurred while saving the template" }, { status: 500 });
        }
    })(request);
}