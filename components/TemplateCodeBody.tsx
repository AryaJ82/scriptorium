
import { Language, LANGUAGES, LANG_CONFIG, TemplateResponse } from "@/utils/interfaces";
import { OutputConsole, type RunStatus } from "@/components/OutputConsole";
import { Button } from "@/components/ui/Button";
import { GitFork, Play, RotateCcw, Save } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import Textarea from "@/components/ui/Textarea";
import { Label } from "@/components/Label";
import { useUserSession } from "@/contexts/UserSessionContext";
import { useCallback, useState } from "react";

export default function TemplateCodeBody({
    template,
    isOwner,
    onSave,
    loading,
    setLoading,
    saveLoading
}: {
    template: TemplateResponse,
    isOwner: boolean,
    onSave: ({ }) => Promise<void>,
    loading: boolean,
    setLoading: (loading: boolean) => void,
    saveLoading: boolean,
}
) {

    const { baseUrl } = useUserSession();
    // --- Execution state ---
    // --- Editor state (initialised from template on load) ---
    const [code, setCode] = useState<string>(template.code);
    const [stdin, setStdin] = useState<string>(template.stdin);

    const [editingStdin, setEditingStdin] = useState(false);

    const [status, setStatus] = useState<RunStatus>('idle');
    const [stdout, setStdout] = useState<string>('');
    const [stderr, setStderr] = useState<string>('');
    const [runError, setRunError] = useState<string | null>(null);

    const isMutated = (template.code === code) && (template.stdin === stdin);

    const reset = useCallback((template: TemplateResponse | null) => {
        if (!template) return;
        setCode(template.code);
        setStdin(template.stdin);
        setStatus('idle');
        setStdout('');
        setStderr('');
        setRunError(null);
    }, []);

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

    const cancelStdinEdit = useCallback(() => {
        if (!template) return;
        setStdin(template.stdin);
        setEditingStdin(false);
    }, [template]);

    return (
        <div className="flex flex-col gap-3">

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
                            {template && LANG_CONFIG[template.language].fileName}
                        </span>

                        <div className="ml-auto flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => reset(template)} disabled={loading || !template}>
                                <RotateCcw className="size-4" /> Reset
                            </Button>


                            {isOwner && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSave({ code, stdin })}
                                    disabled={saveLoading || loading || !template}
                                >
                                    <Save className="size-4" /> Save Changes
                                </Button>
                            )}

                            <Button size="sm" onClick={() => run(code, template.language, stdin)} disabled={loading || status === 'running'}>
                                <Play className="size-4" /> Run
                            </Button>
                        </div>

                    </div>
                    <CodeEditor value={code} onChange={setCode} language={template.language} />
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
                            {(
                                editingStdin ? (
                                    <Button variant="ghost" size="sm" onClick={cancelStdinEdit}>
                                        Reset
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
                            disabled={!editingStdin}
                            className="mt-2 h-24 resize-none font-mono text-[13px]"
                        />
                    </div>

                    <div className="flex-1 overflow-hidden rounded-lg border border-border bg-card">
                        <OutputConsole status={status} stdout={stdout} stderr={stderr} />
                    </div>
                </div>


            </div>
        </div>
    );
}