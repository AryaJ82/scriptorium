
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse } from "next/server";
import prisma from "@/utils/client";
import { normalizeTags, validateTags, isPositiveIntegerString, isOptionalString } from "@/utils/templateValidation";
import type { ValidationError, BlogPOSTBody, BlogPATCHBody, BlogGETQuery } from "@/utils/interfaces";
import { validBlogSortFields, validSortOrders } from "@/utils/interfaces";
import { Prisma } from "@/app/generated/prisma/client";

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


export async function PATCH(request: Request) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const body: BlogPATCHBody = await request.json();
            const { post_id, title, description, tags } = body;
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const patchValidationError = await verifyPATCHParams(body);
            if (patchValidationError) {
                return NextResponse.json({ error: patchValidationError.message }, { status: patchValidationError.status ?? 400 });
            }

            const id = Number(post_id);
            // --- Authorization ---
            const post = await prisma.blogPost.findUnique({ where: { id: id } });
            if (!post) {
                return NextResponse.json({ error: "post not found" }, { status: 404 });
            }
            if (post.authorId !== user.id) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            // --- Tag handling ---
            const tagConnectOrCreate = tags !== undefined ? normalizeTags(tags).map((tag) => ({
                where: { name: tag },
                create: { name: tag },
            })) : undefined;

            const updatedPost = await prisma.blogPost.update({
                where: { id: id },
                data: {
                    ...(title && { title: title.trim() }),
                    ...(description && { description }),
                    ...(tagConnectOrCreate !== undefined && {
                        tags: {
                            set: [],
                            connectOrCreate: tagConnectOrCreate,
                        },
                    }),
                },
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
            });

            return NextResponse.json({ template: updatedPost }, { status: 200 });
        } catch (error) {
            console.error("Error when updating code template:", error);
            return NextResponse.json({ error: "Internal server error when updating code template" }, { status: 500 });
        }
    })(request);
}


export async function DELETE(request: Request) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { post_id } = await request.json();
            if (!post_id || !isPositiveIntegerString(post_id)) {
                return NextResponse.json({ error: "post_id is required and must be a positive integer string" }, { status: 400 });
            }
            const id = Number(post_id);
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const post = await prisma.blogPost.findUnique({
                where: { id: id },
            });
            if (!post) {
                return NextResponse.json({ error: "Blog Post not found" }, { status: 404 });
            }
            if (post.authorId !== user.id) {
                return NextResponse.json({ error: "Unauthorized to delete this blog post" }, { status: 403 });
            }

            await prisma.blogPost.delete({ where: { id: id } });
            return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
        } catch (error) {
            console.error("Error when deleting blog post", error);
            return NextResponse.json({ error: "Internal server error when deleting blog post" }, { status: 500 });
        }
    })(request);
}



export function verifyGETParams(params: BlogGETQuery) {
    const { post_id, linked_template_id, title, description, tags, author, page, pageSize, sortBy, sortOrder } = params;

    if (post_id !== undefined && !isPositiveIntegerString(post_id)) {
        return createError("post_id should be a positive integer");
    }

    if (title !== undefined && !isOptionalString(title, 255)) {
        return createError("Title should be a string with at most 255 characters");
    }

    if (linked_template_id !== undefined && !isOptionalString(linked_template_id, 255)) {
        return createError("linked_template_id should be a string with at most 30 characters");
    }

    if (tags !== undefined) {
        if (!isString(tags) || tags.trim() === "" || tags.length > 50) {
            return createError("Tags should be a non-empty string with at most 50 characters");
        }
    }

    if (description !== undefined && !isOptionalString(description, 1000)) {
        return createError("Description should be a string with at most 1000 characters");
    }

    if (author !== undefined && !isOptionalString(author, 100)) {
        return createError("Author should be a string with at most 100 characters");
    }

    if (page !== undefined && !isPositiveIntegerString(page)) {
        return createError("Page should be a positive integer");
    }

    if (pageSize !== undefined) {
        if (!isPositiveIntegerString(pageSize)) {
            return createError("Page size should be a positive integer");
        }
        const pageSizeNumber = Number(pageSize);
        if (pageSizeNumber > 100) {
            return createError("Page size should be a number between 1 and 100");
        }
    }

    if (sortBy !== undefined && !validBlogSortFields.includes(sortBy as typeof validBlogSortFields[number])) {
        return createError("SortBy should be a valid sort field");
    }

    if (sortOrder !== undefined && !validSortOrders.includes(sortOrder as typeof validSortOrders[number])) {
        return createError("SortOrder should be 'asc' or 'desc'");
    }

    return null;
}


async function verifyPOSTParams(params: BlogPOSTBody) {
    const { title, description, linked_template_id, tags } = params;

    if (linked_template_id !== undefined) {
        if (!isString(linked_template_id) || linked_template_id.trim() === "") {
            return createError("linked_template_id should be a non-empty string if provided");
        }
        const sourceTemplate = await prisma.template.findUnique({ where: { id: linked_template_id } });
        if (!sourceTemplate) {
            return createError("No template found for the provided linked_template_id", 400);
        }
    }

    if (!isString(title) || title.trim() === "") {
        return createError("Please provide a valid title");
    }
    if (title.length > 255) {
        return createError("Title must be less than 255 characters");
    }


    if (!isString(description) || description.trim() === "") {
        return createError("Please provide a valid description");
    }
    if (description.length > 10000) {
        return createError("description must be less than 10000 characters");
    }

    const tagsValidation = validateTags(tags);
    if (tagsValidation) {
        return tagsValidation;
    }
    return null;
}

async function verifyPATCHParams(body: BlogPATCHBody): Promise<ValidationError | null> {
    const { post_id, title, description, tags } = body;

    if (post_id === undefined || !isPositiveIntegerString(post_id)) {
        return createError("post_id is required and must be a positive integer string");
    }

    if (title === undefined && description === undefined && tags === undefined) {
        return createError("At least one field must be provided to update the blog post");
    }

    if (title !== undefined) {
        if (!isString(title) || title.trim() === "") {
            return createError("Please provide a valid title");
        }
        if (title.length > 255) {
            return createError("Title must be less than 255 characters");
        }
    }

    if (description !== undefined) {
        if (!isString(description) || description.length > 2000) {
            return createError("Description should be a string with at most 2000 characters");
        }
    }

    const error = validateTags(tags);
    if (error) {
        return error;
    }

    return null;
}


function isString(value: unknown): value is string {
    return typeof value === "string";
}


function createError(message: string, status = 400): ValidationError {
    return { message, status };
}