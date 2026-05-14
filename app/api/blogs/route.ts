
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse } from "next/server";
import prisma from "@/utils/client";
import { normalizeTags, validateTags } from "@/utils/templateValidation";
import type { ValidationError, BlogPOSTBody, BlogPATCHBody } from "@/utils/interfaces";
import { isPositiveIntegerString } from "@/utils/templateValidation";


export async function GET(request: Request){
    
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
                include: {
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
                return NextResponse.json({ error: "template_id is required and must be a string" }, { status: 400 });
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


async function verifyPOSTParams(params: BlogPOSTBody) {
    const { title, description, linked_template_id, tags } = params;

    if (linked_template_id !== undefined) {
        if (!isString(linked_template_id) || linked_template_id.trim() === "") {
            return createError("linked_template_id should be a non-empty string if provided");
        }
        const sourceTemplate = await prisma.template.findUnique({ where: { id: linked_template_id } });
        if (!sourceTemplate) {
            return createError("No template found to fork from with the provided forkedSourceId", 400);
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
    if (!tagsValidation) {
        return tagsValidation;
    }
    return null;
}


async function verifyPATCHParams(body: BlogPATCHBody): Promise<ValidationError | null> {
    const { post_id, title, description, tags } = body;

    if (post_id === undefined || !isPositiveIntegerString(post_id)) {
        return createError("post_id is required and must be a non-empty string");
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

    const tagsValidation = validateTags(tags);
    if (!tagsValidation) {
        return tagsValidation;
    }

    return null;
}


function isString(value: unknown): value is string {
    return typeof value === "string";
}


function createError(message: string, status = 400): ValidationError {
    return { message, status };
}