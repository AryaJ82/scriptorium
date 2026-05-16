import { Language } from "@/app/generated/prisma/enums";
import prisma from "./client";
export { Language } from "@/app/generated/prisma/enums";

// -------------------- General
export type ValidationError = {
    message: string;
    status?: number;
};

export interface AuthenticatedRequest extends Request {
    user: Awaited<ReturnType<typeof prisma.user.findUnique>>;
}
// ---------------------- Sorting Requests

export type ValidSortFields = 'title' | 'createdAt' | 'language' | 'upvoteCount' | 'downvoteCount';
export type BlogSortFields = 'title' | 'createdAt' | 'upvoteCount' | 'downvoteCount';
export type ValidSortOrder = 'asc' | 'desc';

export const validTemplateSortFields = ["title", "createdAt", "language", 'upvoteCount', 'downvoteCount'] as const;
export const validBlogSortFields = ["title", "createdAt", 'upvoteCount', 'downvoteCount'] as const;
export const validSortOrders = ["asc", "desc"] as const;

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
    template_id: string;
    title?: string;
    code?: string;
    language?: Language;
    description?: string;
    tags?: string[];
}


//-------------- Blogs

export interface BlogGETQuery {
    post_id?: string;
    title?: string;
    linked_template_id?: string;
    description?: string;
    tags?: string;
    author?: string;
    page?: string;
    pageSize?: string;
    sortBy?: BlogSortFields;
    sortOrder?: ValidSortOrder;
}
export interface BlogPOSTBody {
    title: string;
    description: string;
    linked_template_id?: string;
    tags?: string[];
}

export interface BlogPATCHBody {
    post_id: string;
    title?: string;
    description?: string;
    tags?: string[];
}