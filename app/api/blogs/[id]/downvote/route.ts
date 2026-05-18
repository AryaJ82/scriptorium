
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse } from "next/server";
import prisma from "@/utils/client"


// Increment downvote count for a blog
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;
            const blog_id = Number(id);
            if (!id || isNaN(blog_id) || blog_id < 0) {
                return NextResponse.json({ error: "Invalid Blog id." }, { status: 400 });
            }

            const blog = await prisma.blogPost.findUnique({
                where: { id: blog_id },
                select: { downvotingUsers: { where: { id: user.id }, select: { id: true } } },
            });
            if (!blog) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }

            // Check if user has already downvoted this blog
            const hasDownvoted = blog.downvotingUsers.length > 0;

            // increment downvoteCount and create downvote connection
            const updatedBlog = await prisma.blogPost.update({
                where: { id: blog_id },
                data: {
                    downvoteCount: { increment: hasDownvoted ? -1 : 1 },
                    downvotingUsers: hasDownvoted
                        ? { disconnect: { id: user.id } }
                        : { connect: { id: user.id } },
                },
            });

            return NextResponse.json({ blog: updatedBlog }, { status: 200 });
        } catch (error) {
            console.error("Error when downvoting blog:", error);
            return NextResponse.json({ error: "Internal server error when downvoting blog" }, { status: 500 });
        }
    })(request);
}