
import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/utils/client"

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        if (!id || typeof id !== "string" || id.length >= 30) {
            return NextResponse.json({ error: "Template id is required" }, { status: 400 });
        }

        const template = prisma.template.findMany({
            where: { id: id },
            select: {
                id: true,
                title: true,
                description: true,
                language: true,
                code: true,
                isForked: true,
                parentTemplateId: true,
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
                parentTemplate: {
                    select: {
                        id: true,
                        author: true,
                        title: true,
                        createdAt: true,
                    }
                }//TODO: Potentially more fields, such as blog replies.. ( separate query?)
            },
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json({ template }, { status: 200 });

    } catch (error) {
        console.error("Error fetching templates at [id] route", error);
        return NextResponse.json({ error: "Internal server error when fetching templates at [id] route" }, { status: 500 });
    }
}