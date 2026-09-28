

import { NextRequest } from "next/server";
import prisma from "@/utils/client"
import { limitedAuthorSelect, CommentGETQuery } from "@/utils/interfaces";
import { Prisma } from "@/app/generated/prisma/client";
import { getOptionalUser } from "@/utils/middlewareAuth";
import { verifyCommentGETParams } from "@/utils/inputValidation/commentValidation";
import { apiError, apiSuccess, pagination } from "@/utils/apiResponse";



export async function GET(request: NextRequest) {
    try {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams) as CommentGETQuery;

        const error = verifyCommentGETParams(queryParams);
        if (error) {
            return apiError(error.message, error.status ?? 400);
        }
        const { blog_id, parent_comment_id, page, pageSize, sortBy, sortOrder } = queryParams;

        const pageNum = page ? parseInt(page) : 1;
        const pageSizeNum = pageSize ? parseInt(pageSize) : 10;

        const where: Prisma.CommentWhereInput = {
            ...(blog_id && {
                blogPostId: parseInt(blog_id)
            }),
            ...(parent_comment_id ? {
                parentCommentId: parseInt(parent_comment_id)
            } : {
                parentCommentId: null
            }),
            isHidden: false
        }

        const orderBy = {
            [sortBy ?? "upvoteCount"]: (sortOrder === 'desc') ? 'desc' : 'asc',
        } as Prisma.CommentOrderByWithRelationInput;

        const currentUser = await getOptionalUser(request);
        const currentUserId = currentUser?.id;
        const [totalSize, comments] = await prisma.$transaction([
            prisma.comment.count({ where }),
            prisma.comment.findMany({
                where,
                orderBy,
                skip: (pageNum - 1) * pageSizeNum,
                take: pageSizeNum,
                include: {
                    author: limitedAuthorSelect,
                    replies: { select: { id: true } },
                    ...(currentUserId && {
                        upvotingUsers: { where: { id: { equals: currentUserId } }, select: { id: true } },
                        downvotingUsers: { where: { id: { equals: currentUserId } }, select: { id: true } }
                    })
                }
                // ...templateGetInclude({ currentUserId }),
            }),
        ]);

        comments.forEach((c) => {
            Object.assign(c, { numReplies: c.replies.length });
            c.replies = [];
        })
        return apiSuccess(comments, 200, pagination(totalSize, pageNum, pageSizeNum));



    } catch (error) {
        console.error("Error fetching templates", error);
        return apiError("Internal server error when fetching comments", 500);
    }
}
