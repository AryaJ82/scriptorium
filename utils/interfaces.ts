import { Language } from "@/app/generated/prisma/enums";
export { Language } from "@/app/generated/prisma/enums";

// -------------------- General
export type ValidationError = {
    message: string;
    status?: number;
};

export type ValidSortFields = 'title' | 'createdAt' | 'language';
export type ValidSortOrder = 'asc' | 'desc';

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