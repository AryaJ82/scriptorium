'use client'

import { useUserSession } from "@/contexts/UserSessionContext";
import { LANG_CONFIG, Language, LANGUAGES } from "@/utils/interfaces";
import { useState } from "react";
import { SelectValue, Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/Select";
import { OutputConsole, type RunStatus } from "@/components/OutputConsole";
import { Button } from "@/components/ui/Button";
import { Play, RotateCcw } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import Textarea from "@/components/ui/Textarea";
import { Label } from "@/components/Label";

import { STARTER_CODE } from "@/lib/mockData";



export default function PlaygroundPage() {

    const { session } = useUserSession();
    const [language, setLanguage] = useState<Language>("PYTHON");
    const [code, setCode] = useState<string>(STARTER_CODE[language] ?? '');
    const [stdin, setStdin] = useState('')
    const [status, setStatus] = useState<RunStatus>('idle');
    const [stdout, setStdout] = useState('');
    const [stderr, setStderr] = useState('');

    function run() {
        setStatus('running')
        setStdout('')
        setStderr('')
        // Stage 1 mock — Stage 2 will POST to the execution endpoint via fetch.
        window.setTimeout(() => {
            const stamp = new Date().toLocaleTimeString()
            const echo = stdin ? `\n(stdin received: "${stdin.trim()}")` : ''
            setStatus('success')
            setStdout(`Hello, ${stdin.trim() || 'world'}!${echo}\n\n[exited 0 · ${stamp}]`)
        }, 700)
    }

    function reset() {
        setCode(STARTER_CODE[language] ?? '')
        setStdin('')
        setStatus('idle')
        setStdout('')
        setStderr('')
    }
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
                    <Select value={language} onValueChange={(next: Language) => {setLanguage(next); setCode(STARTER_CODE[next] ?? '');}}>
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

                        {/* <SaveTemplateDialog
                        isAuthenticated={session.isAuthenticated}
                        language={language}
                    >
                        <Button variant="outline" size="sm">
                            <Save className="size-4" /> Save as template
                        </Button>
                    </SaveTemplateDialog> */}

                        <Button size="sm" onClick={run} disabled={status === 'running'}>
                            <Play className="size-4" /> Run
                        </Button>
                    </div>
                </div>

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