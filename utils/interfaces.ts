import { NextRequest } from "next/server";
import { Language } from "@/app/generated/prisma/enums";
export { Language } from "@/app/generated/prisma/enums";
import prisma from "./client";
import { Prisma } from "@/app/generated/prisma/client";

// -------------------- General
export type ValidationError = {
    message: string;
    status?: number;
};

export interface AuthenticatedRequest extends NextRequest {
    user: Awaited<ReturnType<typeof prisma.user.findUnique>>;
}
// ---------------------- Sorting Fields

export type ValidSortFields = 'title' | 'createdAt' | 'language' | 'upvoteCount' | 'downvoteCount';
export type BlogSortFields = 'title' | 'createdAt' | 'upvoteCount' | 'downvoteCount';
export type ValidSortOrder = 'asc' | 'desc';

export const validTemplateSortFields = ["title", "createdAt", "language", 'upvoteCount', 'downvoteCount'] as const;
export const validBlogSortFields = ["title", "createdAt", 'upvoteCount', 'downvoteCount'] as const;
export const validSortOrders = ["asc", "desc"] as const;

// ---------------------

// Select which does not return the password hash or profile details from the author table
export const limitedAuthorSelect = {
    select: {
        id: true,
        username: true,
        avatarUrl: true,
        role: true,
    }
};

// ------------------- Execution

export interface ExecutionRequest {
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
    language: Language;
    description?: string;
    tags?: string[];
    forkedSourceId?: string;
}

export interface TemplatePATCHBody {
    title?: string;
    code?: string;
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
export interface BlogCommentPOSTBody {
    content: string;
    parent_comment_id?: string | number;
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
export interface BlogReportPOSTBody {
    title: string;
    content: string;
}

export interface CommentReportPOSTBody {
    title: string;
    content: string;
}