'use client';

import { useParams, useRouter } from "next/navigation";
import { useUserSession } from "@/contexts/UserSessionContext";
import { useCallback, useState } from "react";
import { useApiGet } from "@/lib/useApiGet";

import type { BlogResponse, TemplateResponse } from "@/utils/interfaces";
import BlogCard from "@/components/BlogCard";
import DescriptionSection from "@/components/TemplateDescription";

import TemplateHeader from "@/components/TemplateHeader";
import TemplateCodeBody from "@/components/TemplateCodeBody";
import NotFound from "@/components/NotFound";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TemplateHeaderSkeleton() {
    return (
        <div className="mb-6 flex flex-col gap-2 animate-pulse">
            <div className="h-8 w-64 rounded-md bg-muted" />
            <div className="h-4 w-40 rounded-md bg-muted" />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TemplatePage() {
    const params = useParams();
    const id = params?.id;
    const { session, baseUrl, authFetch } = useUserSession();
    const router = useRouter();

    // --- Template state ---
    const { data: template, setData: setTemplate, loading, error: loadError } = useApiGet<{ data?: TemplateResponse | null; error?: string | null }, TemplateResponse | null>(
        id ? `${baseUrl}/api/templates/${id}` : null,
        {
            transform: (body) => body.data ?? null,
            notOkMessage: "Unable to load template.",
        },
    );

    const { data: linkedPosts, loading: linkedPostsLoading, error: linkedPostsError } = useApiGet<{ data?: BlogResponse[] | null; error?: string | null }, BlogResponse[]>(
        id ? `${baseUrl}/api/blogs?linked_template_id=${encodeURIComponent(String(id))}&page=1&pageSize=20&sortBy=createdAt&sortOrder=desc` : null,
        { transform: (body) => body.data ?? [], notOkMessage: "Unable to load linked blog posts." },
    );

    // --- Update / Delete / fork state ---
    const [actionError, setActionError] = useState<string | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);


    const isOwner = !!session && template?.authorId === session.id;

    const isSavedByCurrentUser = (!!template && template?.savers?.length > 0);


    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------

    const updateTemplate = useCallback(async (updatePayload: { title?: string, code?: string, description?: string, stdin?: string, tags?: string[] }) => {
        if (!template || !session.isAuthenticated || template.authorId !== session?.id) {
            throw new Error("Invalid template or session")
        }

        setActionError(null);
        setSaveLoading(true);

        authFetch(`${baseUrl}/api/templates/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...updatePayload
            }),
        }).then(async (response) => {

            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to save template changes.');
            }

            setTemplate(body.data);
        }).catch((error) => {
            setActionError(error instanceof Error ? error.message : 'Unable to save template changes.');
            return
        }).finally(() => {
            setSaveLoading(false);
        })
    }, [id, authFetch, baseUrl, template, session, setTemplate]);


    const forkTemplate = useCallback(async () => {
        if (!template) return;
        setActionError(null);

        authFetch(`${baseUrl}/api/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: template.title,
                code: template.code,
                stdin: template.stdin,
                language: template.language,
                description: template.description,
                tags: template.tags.map((t) => t.name),
                forkedSourceId: template.id,
            }),
        }).then(async (response) => {

            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to fork template.');
            }

            if (body.data?.id) {
                router.push(`/templates/${body.data.id}`);
            }
        }).catch((error) => {
            setActionError(error instanceof Error ? error.message : 'Unable to fork template.');
        });
    }, [authFetch, baseUrl, template, router]);

    const saveTemplate = useCallback(async () => {
        if (!template || !session.isAuthenticated) {
            throw new Error("Invalid template or session.")
        }
        setActionError(null);
        setSaveLoading(true);

        const savedTemplateUrl = `${baseUrl}/api/users/${session.id}/saved-templates`;
        authFetch(isSavedByCurrentUser ? `${savedTemplateUrl}/${template.id}` : savedTemplateUrl, {
            method: isSavedByCurrentUser ? 'DELETE' : 'POST',
            ...(isSavedByCurrentUser ? {} : {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template_id: template.id }),
            }),
        }).then(async (response) => {
            if (!response) {
                throw new Error('Unable to update saved template.');
            }

            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to update saved template.');
            }

            setTemplate(body.data as TemplateResponse);

        }).catch((error) => {
            setActionError(error instanceof Error ? error.message : 'Unable to save template to profile.');
        }).finally(() => {
            setSaveLoading(false);
        });
    }, [authFetch, template, session.isAuthenticated, baseUrl, session.id, isSavedByCurrentUser, setTemplate]);

    const deleteTemplate = useCallback(async () => {
        if (!template || !session.isAuthenticated || template.authorId !== session?.id) {
            throw new Error("Invalid template or session")
        }
        setActionError(null);

        authFetch(`${baseUrl}/api/templates/${template.id}`, {
            method: 'DELETE',
        }).then(async (response) => {

            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to delete template.');
            }

            router.push(`/playground`);

        }).catch((error) => {
            setActionError(error instanceof Error ? error.message : 'Unable to delete template.');
        });
    }, [authFetch, baseUrl, template, session, router]);

    if (loading && !template) {
        return <NotFound resource="template" title="Template not found" description="That template does not exist or is no longer available." />;
    }

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            {/* Header */}
            {loading ? (
                <TemplateHeaderSkeleton />
            ) : template ? (
                <TemplateHeader
                    template={template}
                    isOwner={isOwner}
                    onSaveTitle={(title: string) => updateTemplate({ title })}
                    onSaveTags={(tags: string[]) => updateTemplate({ tags })}
                    onDelete={deleteTemplate}
                    onFork={forkTemplate}
                    onToggleSaved={saveTemplate}
                    isSavedByCurrentUser={isSavedByCurrentUser}
                />
            ) : null}

            <div className="flex flex-col gap-3">

                {/* Load error */}
                {loadError && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                        <p className="text-sm text-destructive">{loadError}</p>
                    </div>
                )}

                {/* Action error (save, delete, fork) */}
                {actionError && (
                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-destructive">{actionError}</p>
                    </div>
                )}

                {template && <TemplateCodeBody
                    template={template}
                    isOwner={isOwner}
                    updateTemplate={(updates: { code?: string; stdin?: string }) => updateTemplate(updates)}
                    loading={loading}
                    saveLoading={saveLoading}
                />}

                {/* Description / README */}
                {!loading && template && (
                    <DescriptionSection
                        template={template}
                        isOwner={isOwner}
                        onSave={(new_desc: string) => updateTemplate({ description: new_desc })}
                    />
                )}
                <section className="mt-6 border-t border-border pt-6" aria-labelledby="linked-posts-heading">
                    <div className="mb-4 flex items-end justify-between gap-4">
                        <div>
                            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">From the blog</p>
                            <h2 id="linked-posts-heading" className="mt-1 font-serif text-2xl font-semibold tracking-tight">Posts using this template</h2>
                        </div>
                        {!linkedPostsLoading && <span className="text-sm text-muted-foreground">{linkedPosts?.length ?? 0} {linkedPosts?.length === 1 ? "post" : "posts"}</span>}
                    </div>
                    {linkedPostsLoading ? (
                        <div className="grid gap-4" aria-label="Loading linked posts">
                            {[1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-lg border border-border bg-muted/40" />)}
                        </div>
                    ) : linkedPostsError ? (
                        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{linkedPostsError}</p>
                    ) : linkedPosts && linkedPosts.length > 0 ? (
                        <div className="grid gap-4">{linkedPosts.map((post) => <BlogCard key={post.id} post={post} updatePost={() => { }} />)}</div>
                    ) : (
                        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No blog posts link to this template yet.</p>
                    )}
                </section>
            </div>
        </div>
    );
}
