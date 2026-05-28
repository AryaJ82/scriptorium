
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client";
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { limitedAuthorSelect, type BlogReportPOSTBody } from "@/utils/interfaces";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { id } = await params;
            const body: BlogReportPOSTBody = await request.json();
            const { title, content } = body;
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (!content || typeof content !== "string" || content.trim() === "" || content.length > 10000) {
                return NextResponse.json({ error: "Report content is required" }, { status: 400 });
            }

            if (!title || typeof title !== "string" || title.trim() === "" || title.length > 500) {
                return NextResponse.json({ error: "Report title is required" }, { status: 400 });
            }

            if (!id || isNaN(Number(id))) {
                return NextResponse.json({ error: "Blog post id is required" }, { status: 400 });
            }
            const blogPost = await prisma.blogPost.findUnique({ where: { id: Number(id) }, });
            if (!blogPost) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }


            const report = await prisma.contentReport.create({
                data: {
                    author: { connect: { id: user.id } },
                    blogPost: { connect: { id: blogPost.id } },
                    description: content,
                    title: title.trim(),
                },
                include: {
                    author: limitedAuthorSelect,
                    post: true,
                },
            });

            return NextResponse.json({ report }, { status: 200 });
        } catch (error) {
            console.error("Error reporting blog", error);
            return NextResponse.json({ error: "Internal server error when reporting blog" }, { status: 500 });
        }
    })(request);
}