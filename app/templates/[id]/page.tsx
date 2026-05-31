'use client';

import { usePathname } from "next/navigation";
import { useUserSession } from "@/contexts/UserSessionContext";
import { Language, LANGUAGES, LANG_CONFIG } from "@/utils/interfaces";
import { useCallback, useEffect, useState } from "react";
import { OutputConsole, type RunStatus } from "@/components/OutputConsole";
import { Button } from "@/components/ui/Button";
import { Play, RotateCcw, Save } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import Textarea from "@/components/ui/Textarea";
import { Label } from "@/components/Label";
import { SaveTemplateDialogue } from "@/components/SaveTemplateDialogue";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import type { TemplateResponse } from "@/utils/interfaces";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------


function TemplateHeader({ template }: { template: TemplateResponse }) {
    const author = template.author;
    return (
        <div className="mb-6 flex flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <h1 className="font-serif text-3xl font-semibold tracking-tight">
                        {template.title}
                    </h1>
                    {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                </div>

                {/* Author */}
                <button
                    className="flex items-center rounded-full outline-none ring-ring focus-visible:ring-2"
                    aria-label="Visit Author Profile"
                    onClick={() => { }}
                >
                    <Avatar className="size-10 border">
                        {author.avatarUrl ? (
                            <AvatarImage src={author.avatarUrl} alt="" />
                        ) : null}
                        <AvatarFallback className="text-xs font-large">
                            {author.username.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {/* Fork lineage */}
                {template.isForked && template.parentTemplate && (
                    <a
                        href={`/templates/${template.parentTemplate.id}`}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                        Forked from: {template.parentTemplate.title}
                    </a>
                )}

                {/* Tags */}
                {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag) => (
                            <span
                                key={tag.name}
                                className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                            >
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

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
    const { session, baseUrl } = useUserSession();

    // --- Template state ---
    const [template, setTemplate] = useState<TemplateResponse | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // --- Editor state (initialised from template on load) ---
    const [language, setLanguage] = useState<Language>(LANGUAGES[0]);
    const [code, setCode] = useState('');
    const [stdin, setStdin] = useState('');

    // --- Execution state ---
    const [status, setStatus] = useState<RunStatus>('idle');
    const [stdout, setStdout] = useState('');
    const [stderr, setStderr] = useState('');
    const [runError, setRunError] = useState<string | null>(null);

    // Derived: is the current user the author?
    const isOwner = !!session && template?.authorId === session.id;

    // ---------------------------------------------------------------------------
    // Fetch template
    // ---------------------------------------------------------------------------

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
                setLanguage(t.language);
                setCode(t.code);
                setStdin(t.stdin);
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

    const reset = useCallback(() => {
        if (!template) return;
        setCode(template.code);
        setStdin(template.stdin);
        setStatus('idle');
        setStdout('');
        setStderr('');
        setRunError(null);
    }, [template]);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            {/* Header */}
            {loading ? (
                <TemplateHeaderSkeleton />
            ) : template ? (
                <TemplateHeader template={template} />
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

                {/* Editor + I/O panel */}
                <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
                    {/* Code editor */}
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                            <span className="font-mono text-xs text-muted-foreground">
                                {LANG_CONFIG[language].fileName}
                            </span>

                            <div className="ml-auto flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={reset} disabled={loading || !template}>
                                    <RotateCcw className="size-4" /> Reset
                                </Button>

                                {(isOwner) && <SaveTemplateDialogue language={language}>
                                    <Button variant="outline" size="sm" disabled={loading || !template}>
                                        <Save className="size-4" /> Save Changes
                                    </Button>
                                </SaveTemplateDialogue>}

                                <Button size="sm" onClick={() => run(code, language, stdin)} disabled={loading || !template || status === 'running'}>
                                    <Play className="size-4" /> Run
                                </Button>
                            </div>

                        </div>
                        <CodeEditor value={code} onChange={setCode} language={language} />
                    </div>

                    {/* Stdin + output */}
                    <div className="flex flex-col gap-3">
                        <div className="rounded-lg border border-border bg-card p-4">
                            <Label
                                htmlFor="stdin"
                                className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
                            >
                                Standard input (stdin)
                            </Label>
                            <Textarea
                                id="stdin"
                                value={stdin}
                                onChange={(e) => setStdin(e.target.value)}
                                placeholder="Type input passed to your program before running…"
                                className="mt-2 h-24 resize-none font-mono text-[13px]"
                            />
                        </div>

                        <div className="flex-1 overflow-hidden rounded-lg border border-border bg-card">
                            <OutputConsole status={status} stdout={stdout} stderr={stderr} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}