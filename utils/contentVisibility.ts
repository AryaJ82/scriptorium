import type { Prisma } from "@/app/generated/prisma/client";

export function publicBlogWhere(): Prisma.BlogPostWhereInput {
    return { isHidden: false };
}

export function publicCommentWhere(): Prisma.CommentWhereInput {
    return {
        isHidden: false,
        blogPost: { is: { isHidden: false } },
    };
}
