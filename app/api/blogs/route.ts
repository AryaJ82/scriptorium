
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse } from "next/server";
import prisma from "@/utils/client";

import type { BlogPOSTBody, BlogGETQuery } from "@/utils/inputValidation/blogValidation";
import { normalizeTags, verifyGETParams, verifyPOSTParams } from "@/utils/inputValidation/blogValidation";
import { Prisma } from "@/app/generated/prisma/client";

export async function GET(request: Request) {
    try {
        const { searchParams } = (new URL(request.url));
        const queryParams = Object.fromEntries(searchParams) as unknown as BlogGETQuery;

        let error = verifyGETParams(queryParams);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        const { post_id, linked_template_id, title, description, tags, author, page, pageSize, sortBy, sortOrder } = queryParams;
        // Get tags as array of strings from comma separation tags=tag1,tag2,...
        const tagList = normalizeTags(tags?.split(','));


        const pageNum = page ? parseInt(page) : 1;
        const pageSizeNum = pageSize ? parseInt(pageSize) : 10;

        const where: Prisma.BlogPostWhereInput = {
            ...(post_id && {
                id: Number(post_id)
            }),
            ...(title && {
                title: { contains: title },
            }),
            ...(linked_template_id && {
                linkedTemplate: {
                    is: { id: linked_template_id.trim() }
                }
            }),
            ...(description && {
                description: { contains: description, },
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
        } as Prisma.BlogPostOrderByWithRelationInput;

        const [totalSize, templates] = await prisma.$transaction([
            prisma.blogPost.count({ where }),
            prisma.blogPost.findMany({
                where,
                orderBy,
                skip: (pageNum - 1) * pageSizeNum,
                take: pageSizeNum,
                include: {
                    tags: {
                        select: { name: true },
                    },
                    author: true,
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
        return NextResponse.json({ error: "Internal server error when fetching templates" }, { status: 500 });
    }
}


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = params;
            const comment_id = Number(id);
            if (!id || isNaN(comment_id) || comment_id < 0) {
                return NextResponse.json({ error: "Invalid Blog post id." }, { status: 400 });
            }

            const { content } = await request.json();
            if (!content || typeof content !== "string" || content.trim() === "") {
                return NextResponse.json({ error: "Invalid comment content." }, { status: 400 });
            }

            const comment = await prisma.comment.findUnique({ where: { id: comment_id } });
            if (!comment) {
                return NextResponse.json({ error: "Comment not found" }, { status: 404 });
            }
            if (comment.authorId !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            const updatedComment = await prisma.comment.update({
                where: { id: comment_id },
                data: {
                    ...(content && { content }),
                },
                include: {
                    author: true,
                    tags: {
                        select: { name: true },
                    },
                },
            });

            return NextResponse.json({ template: updatedComment }, { status: 200 });
        } catch (error) {
            console.error("Error when updating comment:", error);
            return NextResponse.json({ error: "Internal server error when updating comment" }, { status: 500 });
        }
    })(request);
}


export async function POST(request: Request) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const body: BlogPOSTBody = await request.json();
            const { title, description, tags, linked_template_id } = body;
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const postValidationError = await verifyPOSTParams(body);
            if (postValidationError) {
                return NextResponse.json({ error: postValidationError.message }, { status: postValidationError.status ?? 400 });
            }

            const uniqueTags = normalizeTags(tags);
            const tagConnectOrCreate = uniqueTags.map((tag) => ({
                where: { name: tag },
                create: { name: tag },
            }));

            const newBlogPost = await prisma.blogPost.create({
                data: {
                    title: title.trim(),
                    author: { connect: { id: user.id } },
                    description,
                    ...(tagConnectOrCreate.length > 0 && {
                        tags: {
                            connectOrCreate: tagConnectOrCreate,
                        },
                    }),
                    // Only set linked field if a source ID was provided
                    ...(linked_template_id && {
                        linkedTemplate: { connect: { id: linked_template_id } }
                    })
                },
                select: {
                    id: true,
                    tags: true,
                    author: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    linkedTemplate: {
                        select: {
                            id: true,
                            title: true,
                            tags: true,
                            author: true,
                        }
                    },
                },
            });
            return NextResponse.json(newBlogPost, { status: 201 });
        } catch (error) {
            console.error("Error when creating blog post", error);
            return NextResponse.json({ error: "Internal server error when creating blog post" }, { status: 500 });
        }
    })(request);
}


