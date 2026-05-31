'use client';

import { usePathname, useRouter } from "next/navigation";
import { useUserSession } from "@/contexts/UserSessionContext";
import { Language, LANGUAGES, LANG_CONFIG } from "@/utils/interfaces";
import { useCallback, useEffect, useState } from "react";
import { OutputConsole, type RunStatus } from "@/components/OutputConsole";
import { Button } from "@/components/ui/Button";
import { GitFork, Play, RotateCcw, Save } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import Textarea from "@/components/ui/Textarea";
import { Label } from "@/components/Label";

import type { TemplateResponse } from "@/utils/interfaces";
import DescriptionSection from "@/components/TemplateDescription";

import TemplateHeader from "@/components/TemplateHeader";

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
    const id = usePathname().split('/').pop();
    const { session, baseUrl, authFetch } = useUserSession();
    const router = useRouter();

    // --- Template state ---
    const [template, setTemplate] = useState<TemplateResponse | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // --- Editor state (initialised from template on load) ---
    const [code, setCode] = useState('');
    const [stdin, setStdin] = useState('');

    const [editingStdin, setEditingStdin] = useState(false);

    // --- Execution state ---
    const [status, setStatus] = useState<RunStatus>('idle');
    const [stdout, setStdout] = useState('');
    const [stderr, setStderr] = useState('');
    const [runError, setRunError] = useState<string | null>(null);

    // --- Update / fork state ---
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [forkError, setForkError] = useState<string | null>(null);
    const [forkLoading, setForkLoading] = useState(false);

    // Derived: is the current user the author?
    const isOwner = !!session && template?.authorId === session.id;

    // ---------------------------------------------------------------------------
    // Fetch template
    // ---------------------------------------------------------------------------
    const reset = useCallback((template: TemplateResponse | null) => {
        if (!template) return;
        setCode(template.code);
        setStdin(template.stdin);
        setStatus('idle');
        setStdout('');
        setStderr('');
        setRunError(null);
    }, []);

    useEffect(() => {
        if (!id) return;

        let active = true;
        setLoading(true);
        setLoadError(null);

        fetch(`${baseUrl}/api/templates/${id}`)
            .then(async (res) => {
                const body = await res.json();
                if (!active) return;

                if (!res.ok) {
                    throw new Error(body.error ?? "Unable to load template.");
                }

                const t: TemplateResponse = body.template;
                setTemplate(t);
                setCode(t.code);
                setStdin(t.stdin);
                setEditingStdin(false);
            })
            .catch((err) => {
                if (!active) return;
                setLoadError(err instanceof Error ? err.message : "Unable to load template.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [id, baseUrl]);

    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------

    const cancelStdinEdit = useCallback(() => {
        if (!template) return;
        setStdin(template.stdin);
        setEditingStdin(false);
    }, [template]);

    const run = useCallback(async (code: string, language: string, stdin: string) => {
        setStatus('running');
        setStdout('');
        setStderr('');
        setRunError(null);

        try {
            const res = await fetch(`${baseUrl}/api/execution`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language, stdin }),
            });
            const body = await res.json();

            if (res.ok) {
                setStatus("success");
                setStdout(body.stdout);
                setStderr(body.stderr);
            } else if (res.status === 408) {
                setStatus("timeout");
                setStdout(body.stdout);
                setStderr(body.stderr);
            } else if (res.status === 413) {
                setStatus("error");
                setStdout(body.stdout);
                setStderr(body.error);
            } else {
                setStatus("error");
                setRunError(body.error ?? "An error has occurred.");
            }
        } catch {
            setStatus("error");
            setRunError("An error occurred while executing the code.");
        }
    }, [baseUrl]);

    const updateTemplate = useCallback(async (updatePayload: { title?: string, code?: string, description?: string, stdin?: string, tags?: string[] }) => {
        if (!id) return;
        setSaveError(null);
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
            reset(body.template);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Unable to save template changes.');
        } finally {
            setSaveLoading(false);
        }
    }, [id, authFetch, baseUrl]);


    const forkTemplate = useCallback(async () => {
        if (!template) return;
        setForkError(null);
        setForkLoading(true);

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
            setForkError(error instanceof Error ? error.message : 'Unable to fork template.');
        } finally {
            setForkLoading(false);
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
                />
            ) : null}

            <div className="flex flex-col gap-3">

                {/* Load error */}
                {loadError && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                        <p className="text-sm text-destructive">{loadError}</p>
                    </div>
                )}

                {/* Run error (separate from load error) */}
                {runError && (
                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-destructive">{runError}</p>
                    </div>
                )}

                {(saveError || forkError) && (
                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-sm text-destructive">{saveError ?? forkError}</p>
                    </div>
                )}

                {/* Editor + I/O panel */}
                <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
                    {/* Code editor */}
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                            <span className="font-mono text-xs text-muted-foreground">
                                {template && LANG_CONFIG[template.language].fileName}
                            </span>

                            <div className="ml-auto flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => reset(template)} disabled={loading || !template}>
                                    <RotateCcw className="size-4" /> Reset
                                </Button>

                                {session.isAuthenticated && template && (
                                    <Button variant="outline" size="sm" onClick={forkTemplate} disabled={forkLoading || loading}>
                                        <GitFork className="size-4" /> Fork
                                    </Button>
                                )}

                                {isOwner && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateTemplate({ code, stdin })}
                                        disabled={saveLoading || loading || !template}
                                    >
                                        <Save className="size-4" /> Save Changes
                                    </Button>
                                )}

                                <Button size="sm" onClick={() => run(code, template?.language ?? LANGUAGES[0], stdin)} disabled={loading || !template || status === 'running'}>
                                    <Play className="size-4" /> Run
                                </Button>
                            </div>

                        </div>
                        <CodeEditor value={code} onChange={setCode} language={template?.language ?? LANGUAGES[0]} />
                    </div>

                    {/* Stdin + output */}
                    <div className="flex flex-col gap-3">
                        <div className="rounded-lg border border-border bg-card p-4">
                            <div className="flex items-center justify-between gap-2">
                                <Label
                                    htmlFor="stdin"
                                    className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
                                >
                                    Standard input (stdin)
                                </Label>
                                {isOwner && (
                                    editingStdin ? (
                                        <Button variant="ghost" size="sm" onClick={cancelStdinEdit}>
                                            Cancel
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="sm" onClick={() => setEditingStdin(true)}>
                                            Edit
                                        </Button>
                                    )
                                )}
                            </div>
                            <Textarea
                                id="stdin"
                                value={stdin}
                                onChange={(e) => setStdin(e.target.value)}
                                placeholder="Type input passed to your program before running…"
                                disabled={!isOwner || !editingStdin}
                                className="mt-2 h-24 resize-none font-mono text-[13px]"
                            />
                        </div>

                        <div className="flex-1 overflow-hidden rounded-lg border border-border bg-card">
                            <OutputConsole status={status} stdout={stdout} stderr={stderr} />
                        </div>
                    </div>


                    {/* Description / README */}
                    {!loading && template && (
                        <DescriptionSection
                            description={template.description}
                            isOwner={isOwner}
                            onSave={(new_desc: string) => updateTemplate({ description: new_desc })}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}