

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client"
import { limitedAuthorSelect, CommentGETQuery } from "@/utils/interfaces";
import { Prisma } from "@/app/generated/prisma/client";
import { getOptionalUser } from "@/utils/middlewareAuth";
import { verifyCommentGETParams } from "@/utils/inputValidation/commentValidation";



export async function GET(request: NextRequest) {
    try {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams) as CommentGETQuery;

        const error = verifyCommentGETParams(queryParams);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
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
        return NextResponse.json({
            comments,
            pagination: {
                totalSize,
                totalPages: Math.ceil(totalSize / pageSizeNum),
                page: pageNum,
                pageSize: pageSizeNum,
            }
        },
            { status: 200 })



    } catch (error) {
        console.error("Error fetching templates", error);
        return NextResponse.json({ error: "Internal server error when fetching templates" }, { status: 500 });
    }
}
