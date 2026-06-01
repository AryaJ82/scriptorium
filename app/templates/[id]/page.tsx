'use client';

import { useParams, useRouter } from "next/navigation";
import { useUserSession } from "@/contexts/UserSessionContext";
import { useCallback, useEffect, useState } from "react";

import type { TemplateResponse } from "@/utils/interfaces";
import DescriptionSection from "@/components/TemplateDescription";

import TemplateHeader from "@/components/TemplateHeader";
import TemplateCodeBody from "@/components/TemplateCodeBody";

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
    const [template, setTemplate] = useState<TemplateResponse | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // --- Update / Delete / fork state ---
    const [actionError, setActionError] = useState<string | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);


    const isOwner = !!session && template?.authorId === session.id;

    // ---------------------------------------------------------------------------
    // Fetch template
    // ---------------------------------------------------------------------------


    useEffect(() => {
        if (!id) return;

        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);

        fetch(`${baseUrl}/api/templates/${id}`, {
            signal: controller.signal,
        })
            .then(async (res) => {
                const body = await res.json();
                if (controller.signal.aborted) return;

                if (!res.ok) {
                    throw new Error(body.error ?? "Unable to load template.");
                }

                const t: TemplateResponse = body.template;
                setTemplate(t);
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                setLoadError(err instanceof Error ? err.message : "Unable to load template.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => { controller.abort(); };
    }, [id, baseUrl]);

    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------

    const updateTemplate = useCallback(async (updatePayload: { title?: string, code?: string, description?: string, stdin?: string, tags?: string[] }) => {
        if (!id) return;
        setActionError(null);
        setSaveLoading(true);

        try {
            const response = await authFetch(`${baseUrl}/api/templates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...updatePayload
                }),
            });

            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to save template changes.');
            }

            setTemplate(body.template);
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Unable to save template changes.');
            return
        } finally {
            setSaveLoading(false);
        }
    }, [id, authFetch, baseUrl]);


    const forkTemplate = useCallback(async () => {
        if (!template) return;
        setActionError(null);

        try {
            const response = await authFetch(`${baseUrl}/api/templates`, {
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
            });

            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to fork template.');
            }

            if (body.id) {
                router.push(`/templates/${body.id}`);
            }
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Unable to fork template.');
        }
    }, [authFetch, baseUrl, template]);



    const deleteTemplate = useCallback(async () => {
        if (!template || !session || template.authorId !== session?.id) return;
        setActionError(null);

        try {
            const response = await authFetch(`${baseUrl}/api/templates/${template.id}`, {
                method: 'DELETE',
            });

            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to delete template.');
            }


            router.push(`/playground`);

        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Unable to delete template.');
        }
    }, [authFetch, baseUrl, template]);




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
            </div>


        </div>
    );
}