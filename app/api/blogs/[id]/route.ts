
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { normalizeTags, verifyPATCHParams } from "@/utils/inputValidation/blogValidation";
import type { BlogPATCHBody } from "@/utils/inputValidation/blogValidation";
import { NextResponse } from "next/server";
import prisma from "@/utils/client"


export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: "Invalid Blog post id." }, { status: 400 });
        }

        const post = await prisma.blogPost.findUnique({
            where: { id: Number(id) },
            include: {
                author: true,
                tags: { select: { name: true }, },
                linkedTemplate: {
                    select: {
                        id: true,
                        author: true,
                        title: true,
                        createdAt: true,
                    }
                },
                comments: {
                    include: {
                        author: { select: { username: true }, },
                    }
                }
            },
        });

        if (!post) {
            return NextResponse.json({ error: "Blog Post not found" }, { status: 404 });
        }

        return NextResponse.json({ post }, { status: 200 });

    } catch (error) {
        console.error("Error fetching blog posts at [id] route", error);
        return NextResponse.json({ error: "Internal server error when fetching blog posts at [id] route" }, { status: 500 });
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
            const post_id = Number(id);
            if (!id || isNaN(post_id) || post_id < 0) {
                return NextResponse.json({ error: "Invalid Blog post id." }, { status: 400 });
            }

            const body: BlogPATCHBody = await request.json();
            const patchValidationError = await verifyPATCHParams(body);
            if (patchValidationError) {
                return NextResponse.json({ error: patchValidationError.message }, { status: patchValidationError.status ?? 400 });
            }
            const { title, description, tags } = body;

            const post = await prisma.blogPost.findUnique({ where: { id: post_id } });
            if (!post) {
                return NextResponse.json({ error: "post not found" }, { status: 404 });
            }
            if (post.authorId !== user.id) {
                return NextResponse.json({ error: "Frobidden" }, { status: 403 });
            }

            // --- Tag handling ---
            const tagConnectOrCreate = tags !== undefined ? normalizeTags(tags).map((tag) => ({
                where: { name: tag },
                create: { name: tag },
            })) : undefined;

            const updatedPost = await prisma.blogPost.update({
                where: { id: post_id },
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
                include: {
                    author: true,
                    tags: {
                        select: { name: true },
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


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { id } = params;
            const post_id = Number(id);
            if (!id || isNaN(post_id) || post_id < 0) {
                return NextResponse.json({ error: "Invalid Blog post id." }, { status: 400 });
            }

            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const post = await prisma.blogPost.findUnique({ where: { id: post_id }, });

            if (!post) {
                return NextResponse.json({ error: "Blog Post not found" }, { status: 404 });
            }
            if (post.authorId !== user.id) {
                return NextResponse.json({ error: "Unauthorized to delete this blog post" }, { status: 403 });
            }

            await prisma.blogPost.delete({ where: { id: post_id } });
            return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });

        } catch (error) {
            console.error("Error when deleting blog post", error);
            return NextResponse.json({ error: "Internal server error when deleting blog post" }, { status: 500 });
        }
    })(request);
}
