'use client';

import { usePathname, useRouter } from "next/navigation";
import { useUserSession } from "@/contexts/UserSessionContext";
import { Language, LANGUAGES, LANG_CONFIG } from "@/utils/interfaces";
import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { OutputConsole, type RunStatus } from "@/components/OutputConsole";
import { Button } from "@/components/ui/Button";
import { GitFork, Play, RotateCcw, Save, X } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import Textarea from "@/components/ui/Textarea";
import Input from "@/components/ui/Input";
import { Label } from "@/components/Label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import type { TemplateResponse } from "@/utils/interfaces";
import DescriptionSection from "@/components/TemplateDescription";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------


function TemplateHeader({
    template,
    isOwner,
    title,
    setTitle,
    tags,
    tagDraft,
    setTagDraft,
    onAddTag,
    onRemoveTag,
    editingTitle,
    setEditingTitle,
    editingTags,
    setEditingTags,
    onCancelTitle,
    onCancelTags,
}: {
    template: TemplateResponse;
    isOwner: boolean;
    title: string;
    setTitle: (next: string) => void;
    tags: string[];
    tagDraft: string;
    setTagDraft: (next: string) => void;
    onAddTag: (e: KeyboardEvent<HTMLInputElement>) => void;
    onRemoveTag: (tag: string) => void;
    editingTitle: boolean;
    setEditingTitle: (next: boolean) => void;
    editingTags: boolean;
    setEditingTags: (next: boolean) => void;
    onCancelTitle: () => void;
    onCancelTags: () => void;
}) {
    const author = template.author;

    return (
        <div className="mb-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-2 min-w-0">
                    {isOwner ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {editingTitle ? (
                                <>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="text-3xl font-serif font-semibold tracking-tight border-0 bg-transparent px-0 py-0 focus-visible:ring-0 focus-visible:border-transparent"
                                        aria-label="Template title"
                                    />
                                    <Button variant="ghost" size="sm" onClick={onCancelTitle}>
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <h1 className="font-serif text-3xl font-semibold tracking-tight">
                                        {template.title}
                                    </h1>
                                    <Button variant="ghost" size="sm" onClick={() => setEditingTitle(true)}>
                                        Edit
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <h1 className="font-serif text-3xl font-semibold tracking-tight">
                            {template.title}
                        </h1>
                    )}

                    {template.parentTemplate && (
                        <Link href={`/templates/${template.parentTemplate.id}`}>
                            <span className="inline-flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground">
                                <GitFork className="size-3.5" />
                                <p className="text-sm text-muted-foreground">
                                    {template.parentTemplate.title}
                                </p>
                            </span>
                        </Link>
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

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    {template.isForked && template.parentTemplate && (
                        <a
                            href={`/templates/${template.parentTemplate.id}`}
                            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                        >
                            Forked from: {template.parentTemplate.title}
                        </a>
                    )}

                    {!isOwner && template.tags.length > 0 && (
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

                {isOwner && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">

                            {editingTags ? (
                                <Button variant="ghost" size="sm" onClick={onCancelTags}>
                                    Cancel
                                </Button>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={() => setEditingTags(true)}>
                                    Edit tags
                                </Button>
                            )}
                        </div>
                        {editingTags ? (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex flex-wrap gap-1">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => onRemoveTag(tag)}
                                            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground transition hover:bg-muted/80"
                                        >
                                            #{tag}
                                            <X className="size-3" />
                                        </button>
                                    ))}
                                </div>

                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {editingTags && <div className="min-w-0 flex-1">
                            <Input
                                id="template-tags"
                                value={tagDraft}
                                onChange={(e) => setTagDraft(e.target.value)}
                                onKeyDown={onAddTag}
                                placeholder="Add a tag and press Enter"
                            />
                        </div>}
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
    const { session, baseUrl, authFetch } = useUserSession();
    const router = useRouter();

    // --- Template state ---
    const [template, setTemplate] = useState<TemplateResponse | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // --- Editor state (initialised from template on load) ---
    const [language, setLanguage] = useState<Language>(LANGUAGES[0]);
    const [code, setCode] = useState('');
    const [stdin, setStdin] = useState('');
    const [description, setDesc] = useState('');
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagDraft, setTagDraft] = useState('');
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingTags, setEditingTags] = useState(false);
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
                setDesc(t.description ?? '');
                setTitle(t.title);
                setTags(t.tags.map((tag) => tag.name));
                setEditingTitle(false);
                setEditingTags(false);
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

    const addTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && tagDraft.trim()) {
            e.preventDefault();
            const nextTag = tagDraft.trim().replace(/^#/, '');
            if (!tags.includes(nextTag)) {
                setTags([...tags, nextTag]);
            }
            setTagDraft('');
        }
    }, [tagDraft, tags]);

    const removeTag = useCallback((tag: string) => {
        setTags(tags.filter((current) => current !== tag));
    }, [tags]);

    const cancelTitleEdit = useCallback(() => {
        if (!template) return;
        setTitle(template.title);
        setEditingTitle(false);
    }, [template]);

    const cancelTagsEdit = useCallback(() => {
        if (!template) return;
        setTags(template.tags.map((tag) => tag.name));
        setTagDraft('');
        setEditingTags(false);
    }, [template]);

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

    const reset = useCallback(() => {
        if (!template) return;
        setCode(template.code);
        setStdin(template.stdin);
        setStatus('idle');
        setStdout('');
        setStderr('');
        setRunError(null);
        setTitle(template.title);
        setTags(template.tags.map((tag) => tag.name));
    }, [template]);

    const updateTemplate = useCallback(async () => {
        if (!id || !template) return;
        setSaveError(null);
        setSaveLoading(true);

        try {
            const response = await authFetch(`${baseUrl}/api/templates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    code,
                    stdin,
                    tags,
                }),
            });

            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to save template changes.');
            }

            setTemplate({
                ...template,
                title,
                code,
                stdin,
                tags: tags.map((name) => ({ name })),
            });
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Unable to save template changes.');
        } finally {
            setSaveLoading(false);
        }
    }, [id, authFetch, baseUrl, code, stdin, tags, title, template]);

    const forkTemplate = useCallback(async () => {
        if (!template) return;
        setForkError(null);
        setForkLoading(true);

        try {
            const response = await authFetch(`${baseUrl}/api/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    code,
                    stdin,
                    language,
                    description,
                    tags,
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
    }, [authFetch, baseUrl, code, description, language, router, tags, template, title]);

    const saveDescription = useCallback(async (next: string) => {
        if (!id) return;
        const res = await authFetch(`${baseUrl}/api/templates/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: next }),
        });
        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error ?? "Failed to save description.");
        }
        setDesc(next);
    }, [id, authFetch, baseUrl]);

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
                    title={title}
                    setTitle={setTitle}
                    tags={tags}
                    tagDraft={tagDraft}
                    setTagDraft={setTagDraft}
                    onAddTag={addTag}
                    onRemoveTag={removeTag}
                    editingTitle={editingTitle}
                    setEditingTitle={setEditingTitle}
                    editingTags={editingTags}
                    setEditingTags={setEditingTags}
                    onCancelTitle={cancelTitleEdit}
                    onCancelTags={cancelTagsEdit}
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
                                {LANG_CONFIG[language].fileName}
                            </span>

                            <div className="ml-auto flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={reset} disabled={loading || !template}>
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
                                        onClick={updateTemplate}
                                        disabled={saveLoading || loading || !template}
                                    >
                                        <Save className="size-4" /> Save Changes
                                    </Button>
                                )}

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
                            description={description}
                            isOwner={isOwner}
                            onSave={saveDescription}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}