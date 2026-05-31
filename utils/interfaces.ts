import { NextRequest } from "next/server";
import prisma from "./client";
import { Prisma } from "@/app/generated/prisma/client";


// -------------------- Language
import { Language } from "@/app/generated/prisma/enums";
export { Language } from "@/app/generated/prisma/enums";

export const LANG_CONFIG: Record<Language, { fileName: string; image: string; cmd: string[] }> = {
    PYTHON: { fileName: "main.py", image: 'python:3.13-alpine', cmd: ['sh', '-c', 'python3 /code/main.py < /code/stdin.txt'] },
    JAVASCRIPT: { fileName: "main.js", image: 'node:23-alpine', cmd: ['sh', '-c', 'node /code/main.js < /code/stdin.txt'] },
    C: { fileName: "main.c", image: 'gcc:14', cmd: ['sh', '-c', 'gcc /code/main.c -o /tmp/main && /tmp/main < /code/stdin.txt'] },
    CPP: { fileName: "main.cpp", image: 'gcc:14', cmd: ['sh', '-c', 'g++ /code/main.cpp -o /tmp/main && /tmp/main < /code/stdin.txt'] },
    JAVA: { fileName: "Main.java", image: 'eclipse-temurin:24-jdk-alpine', cmd: ['sh', '-c', 'javac -d /tmp /code/main.java && java -cp /tmp main < /code/stdin.txt'] }
};

export const LANGUAGES = Object.values(Language) as Language[];


// -------------------- General
export type ValidationError = {
    message: string;
    status?: number;
};


// ===================================================
// Data Base interfaces
// ===================================================

// ---------------------- Sorting Fields
export type ValidSortFields = 'title' | 'createdAt' | 'language' | 'upvoteCount' | 'downvoteCount';
export type BlogSortFields = 'title' | 'createdAt' | 'upvoteCount' | 'downvoteCount';
export type ValidSortOrder = 'asc' | 'desc';

export const validTemplateSortFields = ["title", "createdAt", "language", 'upvoteCount', 'downvoteCount'] as const;
export const validBlogSortFields = ["title", "createdAt", 'upvoteCount', 'downvoteCount'] as const;
export const validSortOrders = ["asc", "desc"] as const;

// Select which does not return the password hash or profile details from the author table
export const limitedAuthorSelect = {
    select: {
        id: true,
        username: true,
        avatarUrl: true,
        role: true,
    }
};
interface TemplateAuthor {
    id: string;
    username: string;
    avatarUrl: string;
    role: string;
}

interface Tag {
    name: string;
}

import type {Template} from "@/app/generated/prisma/client"
export interface TemplateResponse extends Template {
    author: TemplateAuthor;
    parentTemplate?: { id: string; title: string };
    tags: Tag[];
}


// ===================================================
// Requests
// ===================================================

export interface AuthenticatedRequest extends NextRequest {
    user: Awaited<ReturnType<typeof prisma.user.findUnique>>;
}


// ------------------- Execution

export interface ExecutionRequestPOSTBody {
    language: Language;
    code: string;
    stdin?: string;       // provide upfront stdin (non-interactive)
}


// ------------------- Templates

export interface TemplateGETQuery {
    template_id?: string;
    title?: string;
    language?: Language;
    tags?: string;
    content?: string;
    author?: string;
    page?: string;
    pageSize?: string;
    sortBy?: ValidSortFields;
    sortOrder?: ValidSortOrder;
}

export interface TemplatePOSTBody {
    title: string;
    code?: string;
    stdin?: string;
    language: Language;
    description?: string;
    tags?: string[];
    forkedSourceId?: string;
}

export interface TemplatePATCHBody {
    title?: string;
    code?: string;
    stdin?: string;
    language?: Language;
    description?: string;
    tags?: string[];
}

export interface SavedTemplateTogglePATCHBody {
    template_id: string;
    unsave?: boolean;
}

//----------------------- Blogs

export interface BlogGETQuery {
    post_id?: string;
    title?: string;
    linked_template_id?: string;
    content?: string;
    tags?: string;
    author?: string;
    page?: string;
    pageSize?: string;
    sortBy?: BlogSortFields;
    sortOrder?: ValidSortOrder;
}
export interface BlogPOSTBody {
    title: string;
    content: string;
    linked_template_id?: string;
    tags?: string[];
}

export interface BlogPATCHBody {
    title?: string;
    content?: string;
    tags?: string[];
}

// --------------------- Comments
export interface CommentPOSTBody {
    content: string;
    parent_comment_id?: string;
}


// ------------------- User-facing request bodies

export interface UserLoginPOSTBody {
    username: string;
    password: string;
}

export interface UserRegisterPOSTBody {
    username: string;
    password: string;
}

export interface UserProfilePATCHBody {
    email?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    phoneNumber?: string;
}

// ---------------------------- Reports
export interface ReportPOSTBody {
    title: string;
    content: string;
}
