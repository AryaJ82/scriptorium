'use client'

import { useUserSession } from "@/contexts/UserSessionContext";
import { LANG_CONFIG, Language, LANGUAGES } from "@/utils/interfaces";
import { startTransition, useCallback, useEffect, useState } from "react";
import { useExecution } from "@/lib/useExecution";
import { SelectValue, Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/Select";
import { OutputConsole } from "@/components/OutputConsole";
import { Button } from "@/components/ui/Button";
import { Play, RotateCcw, Save } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import Textarea from "@/components/ui/Textarea";
import { Label } from "@/components/Label";
import { useRouter } from "next/navigation";

import { STARTER_CODE } from "@/lib/mockData";
import { SaveTemplateDialogue } from "@/components/SaveTemplateDialogue";


export const PLAYGROUND_TEMPLATE_DRAFT_KEY = 'scriptorium:template-draft'

export interface PlaygroundTemplateDraft {
  code: string
  stdin: string
  language: Language
}

export function isPlaygroundTemplateDraft(value: unknown): value is PlaygroundTemplateDraft {
  if (!value || typeof value !== 'object') return false

  const draft = value as Record<string, unknown>
  return (
    typeof draft.code === 'string' &&
    typeof draft.stdin === 'string' &&
    typeof draft.language === 'string' &&
    Object.hasOwn(LANG_CONFIG, draft.language)
  )
}

export default function PlaygroundPage() {

    const { baseUrl, sessionReady } = useUserSession();
    const router = useRouter();
    const { status, stdout, stderr, runError, run, resetExecutionStatus } = useExecution(baseUrl);

    // --- Editor state (initialised from template on load) ---
    const [language, setLanguage] = useState<Language>(LANGUAGES[0]);
    const [code, setCode] = useState(STARTER_CODE[language] ?? '');
    const [stdin, setStdin] = useState('');
    const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
    const [draftRestoreError, setDraftRestoreError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionReady) return;

        const url = new URL(window.location.href);
        if (url.searchParams.get('saveTemplate') !== '1') return;

        try {
            const storedDraft = window.sessionStorage.getItem(PLAYGROUND_TEMPLATE_DRAFT_KEY);
            if (!storedDraft) {
                throw new Error('No template draft was found for this return link.');
            }

            const draft: unknown = JSON.parse(storedDraft);
            if (!isPlaygroundTemplateDraft(draft)) {
                throw new Error('The saved draft has an invalid format.');
            }

            startTransition(() => {
                setLanguage(draft.language);
                setCode(draft.code);
                setStdin(draft.stdin);
                setSaveTemplateOpen(true);
            });
        } catch (error) {
            console.error('Unable to restore the template draft:', error);
            startTransition(() => {
                setDraftRestoreError('We could not restore your draft. Return to the playground and try again.');
            });
        } finally {
            try {
                window.sessionStorage.removeItem(PLAYGROUND_TEMPLATE_DRAFT_KEY);
            } catch (error) {
                console.error('Unable to clear the restored template draft:', error);
            }
            router.replace('/playground', { scroll: false });
        }
    }, [router, sessionReady]);

    const resetCode = useCallback(() => {
        setCode(STARTER_CODE[language] ?? '')
        setStdin('')
        resetExecutionStatus();
    }, [language, resetExecutionStatus]);

    const executeCode = useCallback(() => {
        run(code, language, stdin);
    }, [code, language, stdin, run]);
    
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="mb-6 flex flex-col gap-1">
                <h1 className="font-serif text-3xl font-semibold tracking-tight">
                    Playground
                </h1>
                <p className="text-muted-foreground">
                    Write code, provide input, and run it instantly. Save it as a
                    template when you&apos;re happy with it.
                </p>
                <ol className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <li><span className="font-medium text-foreground">1.</span> Edit the sample or run it as-is.</li>
                    <li><span className="font-medium text-foreground">2.</span> Add standard input only if your code asks for it.</li>
                    <li><span className="font-medium text-foreground">3.</span> Save when you are ready; saving requires an account.</li>
                </ol>
            </div>

            {draftRestoreError && (
                <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {draftRestoreError}
                </p>
            )}

            <div className="flex flex-col gap-3">

                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
                    <Select value={language} onValueChange={(next: Language) => { setLanguage(next); setCode(STARTER_CODE[next] ?? ''); }}>
                        <SelectTrigger className="w-40" size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map((l) => (
                                <SelectItem key={l} value={l}>
                                    {LANG_CONFIG[l].displayLabel}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={resetCode}>
                            <RotateCcw className="size-4" /> Reset
                        </Button>

                        <SaveTemplateDialogue
                        language={language}
                        code={code}
                        stdin={stdin}
                        open={saveTemplateOpen}
                        onOpenChange={setSaveTemplateOpen}
                    >
                        <Button variant="outline" size="sm">
                            <Save className="size-4" /> Save as template
                        </Button>
                    </SaveTemplateDialogue>

                        <Button size="sm" onClick={executeCode} disabled={status === 'running'}>
                            <Play className="size-4" /> Run
                        </Button>
                    </div>
                </div>

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