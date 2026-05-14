
import { NextResponse } from "next/server";
import prisma from "@/utils/client"


export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: "Invalid Blog post id is required" }, { status: 400 });
        }

        const post = await prisma.blogPost.findUnique({
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