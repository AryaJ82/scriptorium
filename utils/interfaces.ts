import { NextRequest } from "next/server";
import prisma from "./client";


// -------------------- Language
import { Language } from "@/app/generated/prisma/enums";
export { Language } from "@/app/generated/prisma/enums";

export const LANG_CONFIG: Record<Language, { displayLabel: string, fileName: string; image: string; cmd: string[] }> = {
    PYTHON: { displayLabel: "Python", fileName: "main.py", image: 'python:3.13-alpine', cmd: ['sh', '-c', 'python3 /code/main.py < /code/stdin.txt'] },
    JAVASCRIPT: { displayLabel: "Javascript", fileName: "main.js", image: 'node:23-alpine', cmd: ['sh', '-c', 'node /code/main.js < /code/stdin.txt'] },
    C: { displayLabel: "C", fileName: "main.c", image: 'gcc:14', cmd: ['sh', '-c', 'gcc /code/main.c -o /tmp/main && /tmp/main < /code/stdin.txt'] },
    CPP: { displayLabel: "C++", fileName: "main.cpp", image: 'gcc:14', cmd: ['sh', '-c', 'g++ /code/main.cpp -o /tmp/main && /tmp/main < /code/stdin.txt'] },
    JAVA: { displayLabel: "Java", fileName: "Main.java", image: 'eclipse-temurin:24-jdk-alpine', cmd: ['sh', '-c', 'javac -d /tmp /code/main.java && java -cp /tmp main < /code/stdin.txt'] }
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

export const validTemplateSortFields = ["createdAt", "title", "language"] as const;
export const validBlogSortFields = ["createdAt", "title", 'upvoteCount', 'downvoteCount'] as const;
export const validSortOrders = ["desc", "asc"] as const;

// ---------------------- Prisma query defaults
// Select which does not return the password hash or profile details from the author table
export const limitedAuthorSelect = {
    select: {
        id: true,
        username: true,
        avatarUrl: true,
        role: true,
    }
};

// Attributes returned for GET and PATCH
export function templateGetInclude({ currentUserId, }: { currentUserId?: string; }) {
    return {
        include: {
            author: limitedAuthorSelect,
            tags: { select: { name: true }, },
            parentTemplate: {
                select: {
                    id: true,
                    author: limitedAuthorSelect,
                    title: true,
                    createdAt: true,
                },
            },
            ...(currentUserId && { savers: { where: { id: { equals: currentUserId } }, select: { id: true } } }),
        }
    }
};

// Attributes returned for requests to the blog api to the [id] route. Comments not included
export function blogResponseInclude({ currentUserId, }: { currentUserId?: string; }) {
    return {
        include: {
            author: limitedAuthorSelect,
            tags: { select: { name: true }, },
            linkedTemplate: templateGetInclude({ currentUserId }),
            ...(currentUserId && {
                upvotingUsers: { where: { id: { equals: currentUserId } }, select: { id: true } },
                downvotingUsers: { where: { id: { equals: currentUserId } }, select: { id: true } }
            })
        }
    }
};

export function commentResponseInclude({ currentUserId, }: { currentUserId?: string; }) {
    return {
        include: {
            author: limitedAuthorSelect,
            replies: { select: { id: true } },
            ...(currentUserId && {
                upvotingUsers: { where: { id: { equals: currentUserId } }, select: { id: true } },
                downvotingUsers: { where: { id: { equals: currentUserId } }, select: { id: true } }
            })
        }
    }
};
// ----------------------- Response interfaces
interface Author {
    id: string;
    username: string;
    avatarUrl: string;
    role: string;
}
interface Tag {
    name: string;
}


import type { Template } from "@/app/generated/prisma/client"
export interface TemplateResponse extends Template {
    author: Author;
    parentTemplate?: { id: string; title: string };
    tags: Tag[];
    savers: { id: string }[]; // This will contain at most one element
}

import type { BlogPost } from "@/app/generated/prisma/client";
export interface BlogResponse extends BlogPost {
    author: Author;
    tags: Tag[];
    comments?: CommentResponse[];
    linkedTemplate?: TemplateResponse;
    upvotingUsers: { id: string }[]; // This will contain at most one element, representing whether the current used has liked this element
    downvotingUsers: { id: string }[]; // This will contain at most one element, representing whether the current used has diliked this element
}

import type { Comment } from "@/app/generated/prisma/client";
export interface CommentResponse extends Comment {
    author: Author;
    numReplies: number;
    upvotingUsers: { id: string }[]; // This will contain at most one element, representing whether the current used has liked this element
    downvotingUsers: { id: string }[]; // This will contain at most one element, representing whether the current used has diliked this element
}

// Return type for requests to profile under api/users/[id] and 
export interface UserProfileData {
    id: string;
    username: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    phoneNumber?: string | null;
    role?: string | null;
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

export interface SavedTemplateTogglePOSTBody {
    template_id: string;
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

export interface CommentGETQuery {
    blog_id?: string;
    parent_comment_id?: string;
    page?: string;
    pageSize?: string;
    sortBy?: ValidSortFields;
    sortOrder?: ValidSortOrder;
}
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
