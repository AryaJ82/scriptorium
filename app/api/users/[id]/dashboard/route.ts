import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/client";
import { withAuth } from "@/utils/middlewareAuth";
import type { AuthenticatedRequest } from "@/utils/middlewareAuth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(async (request: AuthenticatedRequest) => {
    const { user } = request;
    const { id } = await params;
    if (!user || user.id !== id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const textFilter = query ? { contains: query, mode: "insensitive" as const } : undefined;

    try {
      const [profile, templates, blogs, comments, savedTemplates] = await Promise.all([
        prisma.user.findUnique({ where: { id: user.id }, select: { id: true, username: true, avatarUrl: true, role: true, createdAt: true } }),
        prisma.template.findMany({ where: { authorId: user.id, ...(textFilter && { OR: [{ title: textFilter }, { description: textFilter }] }) }, orderBy: { updatedAt: "desc" }, take: 12, select: { id: true, title: true, description: true, language: true, updatedAt: true, tags: { select: { name: true } } } }),
        prisma.blogPost.findMany({ where: { authorId: user.id, ...(textFilter && { OR: [{ title: textFilter }, { content: textFilter }] }) }, orderBy: { updatedAt: "desc" }, take: 12, select: { id: true, title: true, content: true, updatedAt: true, tags: { select: { name: true } } } }),
        prisma.comment.findMany({ where: { authorId: user.id, ...(textFilter && { content: textFilter }) }, orderBy: { updatedAt: "desc" }, take: 12, select: { id: true, content: true, createdAt: true, updatedAt: true, blogPost: { select: { id: true, title: true } } } }),
        prisma.template.findMany({ where: { savers: { some: { id: user.id } }, ...(textFilter && { OR: [{ title: textFilter }, { description: textFilter }] }) }, orderBy: { updatedAt: "desc" }, take: 12, select: { id: true, title: true, description: true, language: true, updatedAt: true, author: { select: { username: true } }, tags: { select: { name: true } } } }),
      ]);
      return NextResponse.json({ profile, templates, blogs, comments, savedTemplates });
    } catch (error) {
      console.error("Error fetching user dashboard", error);
      return NextResponse.json({ error: "Unable to load dashboard" }, { status: 500 });
    }
  })(request);
}

