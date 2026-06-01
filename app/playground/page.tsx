'use client'

import { useUserSession } from "@/contexts/UserSessionContext";
import { LANG_CONFIG, Language, LANGUAGES } from "@/utils/interfaces";
import { useCallback, useState } from "react";
import { useExecution } from "@/lib/useExecution";
import { SelectValue, Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/Select";
import { OutputConsole } from "@/components/OutputConsole";
import { Button } from "@/components/ui/Button";
import { Play, RotateCcw, Save } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import Textarea from "@/components/ui/Textarea";
import { Label } from "@/components/Label";

import { STARTER_CODE } from "@/lib/mockData";
import { SaveTemplateDialogue } from "@/components/SaveTemplateDialogue";



export default function PlaygroundPage() {

    const { baseUrl } = useUserSession();
    const { status, stdout, stderr, runError, run, reset } = useExecution(baseUrl);

    // --- Editor state (initialised from template on load) ---
    const [language, setLanguage] = useState<Language>(LANGUAGES[0]);
    const [code, setCode] = useState(STARTER_CODE[language] ?? '');
    const [stdin, setStdin] = useState('');

    const resetCode = useCallback(() => {
        setCode(STARTER_CODE[language] ?? '')
        setStdin('')
        reset();
    }, [language, reset]);



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

                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={resetCode}>
                            <RotateCcw className="size-4" /> Reset
                        </Button>

                        <SaveTemplateDialogue
                        language={language}
                        code={code}
                        stdin={stdin}
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