
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { normalizeTags, verifyPATCHParams } from "@/utils/inputValidation/blogValidation";
import type { BlogPATCHBody } from "@/utils/interfaces";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client"
import { limitedAuthorSelect } from "@/utils/interfaces";
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!isPositiveIntegerString(id)) {
            return NextResponse.json({ error: "Invalid Blog post id." }, { status: 400 });
        }

        const post = await prisma.blogPost.findUnique({
            where: { id: Number(id) },
            include: {
                author: limitedAuthorSelect,
                tags: { select: { name: true }, },
                linkedTemplate: {
                    select: {
                        id: true,
                        author: limitedAuthorSelect,
                        title: true,
                        createdAt: true,
                    }
                },
                comments: {
                    include: {
                        author: limitedAuthorSelect,
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


export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;
            const post_id = Number(id);
            if (!id || isNaN(post_id) || post_id < 0) {
                return NextResponse.json({ error: "Invalid Blog post id." }, { status: 400 });
            }

            const body: BlogPATCHBody = await request.json();
            const patchValidationError = await verifyPATCHParams(body);
            if (patchValidationError) {
                return NextResponse.json({ error: patchValidationError.message }, { status: patchValidationError.status ?? 400 });
            }
            const { title, content, tags } = body;

            const post = await prisma.blogPost.findUnique({ where: { id: post_id } });
            if (!post) {
                return NextResponse.json({ error: "post not found" }, { status: 404 });
            }
            if (post.authorId !== user.id) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
                    ...(content && { content }),
                    ...(tagConnectOrCreate !== undefined && {
                        tags: {
                            set: [],
                            connectOrCreate: tagConnectOrCreate,
                        },
                    }),
                },
                include: {
                    author: limitedAuthorSelect,
                    tags: {
                        select: { name: true },
                    },
                },
            });

            return NextResponse.json({ blog: updatedPost }, { status: 200 });
        } catch (error) {
            console.error("Error when updating blog post:", error);
            return NextResponse.json({ error: "Internal server error when updating blog post" }, { status: 500 });
        }
    })(request);
}


export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { id } = await params;
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
