
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/utils/client"



export async function GET(request: Request) {
    try {
        const { searchParams } = (new URL(request.url));
        const queryParams = Object.fromEntries(searchParams) as unknown as BlogGETQuery;

        let error = await verifyGETParams(queryParams);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
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
                select: {
                    id: true,
                    title: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
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
        return NextResponse.json({ error: "Internal server error when fetching templates" }, { status: 500 });
    }
}


export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: "Invalid Blog post id is required" }, { status: 400 });
        }

        const post = prisma.blogPost.findMany({
            where: { id: Number(id) },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
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
                linkedTemplate: {
                    select: {
                        id: true,
                        author: true,
                        title: true,
                        createdAt: true,
                    }
                }, //TODO: Potentially more fields, , such as comments.. ( separate query?)
                comments: {
                    select: {
                        id: true,
                        content: true,
                        authorId: true,
                        author: {
                            select: {username: true}
                        },
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            },
        });

        if (!post) {
            return NextResponse.json({ error: "Blog not found" }, { status: 404 });
        }

        return NextResponse.json({ post }, { status: 200 });

    } catch (error) {
        console.error("Error fetching blog posts at [id] route", error);
        return NextResponse.json({ error: "Internal server error when fetching blog posts at [id] route" }, { status: 500 });
    }
}