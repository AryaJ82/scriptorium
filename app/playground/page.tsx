'use client'

import { useUserSession } from "@/contexts/UserSessionContext";
import { LANG_CONFIG, Language, LANGUAGES } from "@/utils/interfaces";
import { useCallback, useState } from "react";
import { SelectValue, Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/Select";
import { OutputConsole, type RunStatus } from "@/components/OutputConsole";
import { Button } from "@/components/ui/Button";
import { Play, RotateCcw, Save } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import Textarea from "@/components/ui/Textarea";
import { Label } from "@/components/Label";

import { STARTER_CODE } from "@/lib/mockData";
import { SaveTemplateDialogue } from "@/components/SaveTemplateDialogue";



export default function PlaygroundPage() {

    const { session, baseUrl } = useUserSession();

    // --- Template state ---
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
        setCode(STARTER_CODE[language] ?? '')
        setStdin('')
        setStatus('idle')
        setStdout('')
        setStderr('')
        setRunError(null);
    }, []);



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
            </div>


            <div className="flex flex-col gap-3">

                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
                    <Select value={language} onValueChange={(next: Language) => { setLanguage(next); setCode(STARTER_CODE[next] ?? ''); }}>
                        <SelectTrigger className="w-40" size="sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map((l) => (
                                <SelectItem key={l} value={l}>
                                    {l.charAt(0) + l.slice(1).toLowerCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* {title && (
                    <span className="hidden truncate font-mono text-sm text-muted-foreground sm:inline">
                        {title}
                    </span>
                )} */}

                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={reset}>
                            <RotateCcw className="size-4" /> Reset
                        </Button>

                        <SaveTemplateDialogue
                        language={language}
                    >
                        <Button variant="outline" size="sm">
                            <Save className="size-4" /> Save as template
                        </Button>
                    </SaveTemplateDialogue>

                        <Button size="sm" onClick={() => run(code, language, stdin)} disabled={status === 'running'}>
                            <Play className="size-4" /> Run
                        </Button>
                    </div>
                </div>

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

                <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
                    <div className="overflow-hidden rounded-lg border border-border bg-card">
                        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                            <span className="font-mono text-xs text-muted-foreground">
                                {LANG_CONFIG[language].fileName}
                            </span>
                        </div>
                        <CodeEditor value={code} onChange={setCode} language={language} />
                    </div>

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