
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
                return NextResponse.json({ error: "Comment id is required" }, { status: 400 });
            }
            const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) }, });
            if (!comment) {
                return NextResponse.json({ error: "Comment not found" }, { status: 404 });
            }

            const report = await prisma.commentReport.create({
                data: {
                    author: { connect: { id: user.id } },
                    comment: { connect: { id: comment.id } },
                    content: content,
                    title: title.trim(),
                },
                include: {
                    author: limitedAuthorSelect,
                    comment: true,
                },
            });

            return NextResponse.json({ report }, { status: 200 });
        } catch (error) {
            console.error("Error reporting comment", error);
            return NextResponse.json({ error: "Internal server error when reporting comment" }, { status: 500 });
        }
    })(request);
}