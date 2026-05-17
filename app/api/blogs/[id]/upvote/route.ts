
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { NextResponse } from "next/server";
import prisma from "@/utils/client"


// Increment upvote count for a comment
export async function POST(request: Request, { params }: { params: { id: string } }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = params;
            const blog_id = Number(id);
            if (!id || isNaN(blog_id) || blog_id < 0) {
                return NextResponse.json({ error: "Invalid Blog id." }, { status: 400 });
            }

            const blog = await prisma.blogPost.findUnique({
                where: { id: blog_id },
                select: { upvotingUsers: { where: { id: user.id }, select: { id: true } } },
            });
            if (!blog) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }

            // Check if user has already upvoted this comment
            const hasUpvoted = blog.upvotingUsers.length > 0;

            // increment upvoteCount and create upvote connection
            const updatedBlog = await prisma.blogPost.update({
                where: { id: blog_id },
                data: {
                    upvoteCount: { increment: hasUpvoted ? -1 : 1 },
                    upvotingUsers: hasUpvoted
                        ? { disconnect: { id: user.id } }
                        : { connect: { id: user.id } },
                },
            });

            return NextResponse.json({ blog: updatedBlog }, { status: 200 });
        } catch (error) {
            console.error("Error when upvoting blog:", error);
            return NextResponse.json({ error: "Internal server error when upvoting blog" }, { status: 500 });
        }
    })(request);
}