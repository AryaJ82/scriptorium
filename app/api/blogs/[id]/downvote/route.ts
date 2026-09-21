import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client"
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";
import { blogResponseInclude } from "@/utils/interfaces";

// PUT /api/blogs/[id]/vote - Add or confirm a downvote
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return NextResponse.json({ error: "Invalid blog id." }, { status: 400 });
            }

            const blog = await prisma.blogPost.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    downvotingUsers: { where: { id: user.id }, select: { id: true } }
                },
            });
            if (!blog) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }

            const hasDownvoted = blog.downvotingUsers.length > 0;
            
            const updatedBlog = await prisma.blogPost.update({
                where: { id: blog.id },
                data: {
                    ...(hasDownvoted ? {} : {
                        downvoteCount: { increment: 1 },
                        downvotingUsers: { connect: { id: user.id } },
                    }),
                },
                ...blogResponseInclude({ currentUserId: user.id })
            });

            return NextResponse.json({ blog: updatedBlog }, { status: 200 });
        } catch (error) {
            console.error("Error when downvoting blog:", error);
            return NextResponse.json({ error: "Internal server error when downvoting blog" }, { status: 500 });
        }
    })(request);
}

// DELETE /api/blogs/[id]/vote - Remove an downvote
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;
            if (!isPositiveIntegerString(id)) {
                return NextResponse.json({ error: "Invalid blog id." }, { status: 400 });
            }

            const blog = await prisma.blogPost.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    downvotingUsers: { where: { id: user.id }, select: { id: true } }
                },
            });
            if (!blog) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }

            const hasDownvoted = blog.downvotingUsers.length > 0;
            
            const updatedBlog = await prisma.blogPost.update({
                where: { id: blog.id },
                data: {
                    ...(hasDownvoted ? {
                        downvoteCount: { increment: -1 },
                        downvotingUsers: { disconnect: { id: user.id } },
                    } : {}),
                },
                ...blogResponseInclude({ currentUserId: user.id })
            });

            return NextResponse.json({ blog: updatedBlog }, { status: 200 });
        } catch (error) {
            console.error("Error when removing downvote from blog:", error);
            return NextResponse.json({ error: "Internal server error when removing downvote" }, { status: 500 });
        }
    })(request);
}
