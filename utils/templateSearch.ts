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
    tag: string;
    content?: string;
    author?: string;
    page?: string;
    pageSize?: string;
    sortBy?: ValidSortFields;
    sortOrder?: ValidSortOrder;
}

export type { TemplateGETQuery, ValidSortFields, ValidSortOrder };

export async function templateSearch(where: Prisma.TemplateWhereInput, orderBy: Prisma.TemplateOrderByWithRelationInput, pageNum: number, pageSizeNum: number) {
    try {
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
                            id: true,
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
        return NextResponse.json({ error: "An error occurred while fetching the templates" }, { status: 500 });
    }
}

export function verifyGETParams(params: TemplateGETQuery) {
    const { title, language, tag, content, author, page, pageSize, sortBy, sortOrder } = params;

    if (title && typeof title !== "string") {
        return NextResponse.json({ error: "Title should be a string" }, { status: 400 });
    }
    if (language && !(language in Language)) {
        return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }
    if (tag && typeof (tag !== "string" || tag.length > 50)) {
        return NextResponse.json({ error: "Tags should be a string" }, { status: 400 });
    }
    if (content && (typeof content !== "string" || content.length > 1000)) {
        return NextResponse.json({ error: "Content should be a string" }, { status: 400 });
    }
    if (author && (typeof author !== "string" || author.length > 100)) {
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
