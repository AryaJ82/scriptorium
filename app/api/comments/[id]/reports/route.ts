
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client";
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { limitedAuthorSelect } from "@/utils/interfaces";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { id } = await params;
            const { title, content } = await request.json();
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
                return NextResponse.json({ error: "Comment id is required" }, { status: 400 });
            }
            const comment = await prisma.comment.findUnique({ where: { id: Number(id) }, });
            if (!comment) {
                return NextResponse.json({ error: "Comment not found" }, { status: 404 });
            }

            const report = await prisma.contentReport.create({
                data: {
                    author: { connect: { id: user.id } },
                    comment: { connect: { id: comment.id } },
                    description: content,
                    title: title.trim(),
                },
                include: {
                    author: limitedAuthorSelect,
                    comment: true,
                },
            });

            return NextResponse.json({ report }, { status: 200 });
        } catch (error) {
            console.error("Error reporting blog", error);
            return NextResponse.json({ error: "Internal server error when reporting blog" }, { status: 500 });
        }
    })(request);
}