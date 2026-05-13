import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth"
import { NextResponse } from "next/server"
import prisma from "@/utils/client"
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


export async function GET(request: Request) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
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
                // Scope to only this user's saved templates
                savers: { // Template.savers User[] @relation(...) is a model field
                    some: { id: user.id },
                },
                ...(title && {
                    title: { contains: title, mode: 'insensitive' },
                }),
                ...(language && {
                    language: { equals: language as Language },
                }),
                ...(content && {
                    OR: [
                        { description: { contains: content, mode: 'insensitive' } },
                        { code: { contains: content, mode: 'insensitive' } },
                    ],
                }),
                ...(author && {
                    author: {
                        is: { username: { equals: author, mode: 'insensitive' } },
                    },
                }),
                ...(tagList.length > 0 && {
                    AND: tagList.map((tag) => ({
                        tags: { some: { name: { equals: tag, mode: 'insensitive' } } },
                    })),
                }),
            };

            const orderBy: Prisma.TemplateOrderByWithRelationInput = {};
            if (sortBy) {
                const validSortFields = ['title', 'createdAt', 'language'];
                if (validSortFields.includes(sortBy)) {
                    orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';
                }
            } else {
                orderBy.createdAt = 'desc';
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
            console.error("Error fetching saved templates", error);
            return NextResponse.json({ error: "An error occurred while fetching the saved templates" }, { status: 500 });
        }
    })(request);
}


export async function PATCH(request: Request) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            const { template_id, unsave } = await request.json();
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (!template_id) {
                return NextResponse.json({ error: "Template ID is required" }, { status: 400 });

            }

            const template = await prisma.template.findUnique({
                where: { id: template_id },
            });

            if (!template) {
                return NextResponse.json({ error: "Template not found" }, { status: 404 });
            }

            // save by default, unsave if unsave is true
            let prop = unsave ? { disconnect: { id: template_id } } : { connect: { id: template_id } };

            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { savedTemplates: prop },
                select: {
                    username: true,
                    savedTemplates: true
                }
            });

            return NextResponse.json({
                message: unsave ? "Template unsaved successfully" : "Template saved successfully",
                user: updatedUser
            });

        } catch (error) {
            console.error("Error saving template", error);
            return NextResponse.json({ error: "An error occurred while saving the template" }, { status: 500 });
        }
    })(request);
}