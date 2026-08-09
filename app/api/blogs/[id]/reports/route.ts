
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/utils/client";
import { AuthenticatedRequest, withAuth } from "@/utils/middlewareAuth";
import { limitedAuthorSelect, type ReportPOSTBody } from "@/utils/interfaces";
import { verifyReportPOSTBody } from "@/utils/inputValidation/reportValidation";
import { isPositiveIntegerString } from "@/utils/inputValidation/generalValidation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withAuth(async (request: AuthenticatedRequest) => {
        try {
            const { user } = request;
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            const { id } = await params;

            const body: ReportPOSTBody = await request.json();
            const error = verifyReportPOSTBody(body);
            if (error) {
                return NextResponse.json({ error: error.message }, { status: error.status });
            }
            const { title, content } = body;

            if (!isPositiveIntegerString(id)) {
                return NextResponse.json({ error: "Blog post id is required" }, { status: 400 });
            }
            const blogPost = await prisma.blogPost.findUnique({ where: { id: parseInt(id) }, });
            if (!blogPost) {
                return NextResponse.json({ error: "Blog not found" }, { status: 404 });
            }

            const report = await prisma.blogReport.create({
                data: {
                    author: { connect: { id: user.id } },
                    blogPost: { connect: { id: blogPost.id } },
                    content: content,
                    title: title.trim(),
                },
                include: {
                    author: limitedAuthorSelect,
                    blogPost: true,
                },
            });

            return NextResponse.json({ report }, { status: 200 });
        } catch (error) {
            console.error("Error reporting blog", error);
            return NextResponse.json({ error: "Internal server error when reporting blog" }, { status: 500 });
        }
    })(request);
}