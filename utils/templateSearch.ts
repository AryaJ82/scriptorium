import { NextResponse } from "next/server"
import prisma from "@/utils/client"
import { Prisma } from "@/app/generated/prisma/client";

export { verifyGETParams, normalizeTags } from "./templateValidation";


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
