import prisma from "@/utils/client";
import { Prisma } from "@/app/generated/prisma/client";
import { templateGetInclude } from "./interfaces";

export { verifyTemplateGETParams as verifyGETParams, normalizeTags } from "./inputValidation/templateValidation";

export async function templateSearch(
    where: Prisma.TemplateWhereInput,
    orderBy: Prisma.TemplateOrderByWithRelationInput,
    pageNum: number,
    pageSizeNum: number,
    currentUserId?: string,
) {
    const [totalSize, templates] = await prisma.$transaction([
        prisma.template.count({ where }),
        prisma.template.findMany({
            where,
            orderBy,
            skip: (pageNum - 1) * pageSizeNum,
            take: pageSizeNum,
            ...templateGetInclude({currentUserId}),
        }),
    ]);

    return {
        templates,
        pagination: {
            totalSize,
            totalPages: Math.ceil(totalSize / pageSizeNum),
            page: pageNum,
            pageSize: pageSizeNum,
        },
    };
}
