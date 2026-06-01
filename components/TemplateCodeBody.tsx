
import { LANG_CONFIG, TemplateResponse } from "@/utils/interfaces";
import { OutputConsole, type RunStatus } from "@/components/OutputConsole";
import { Button } from "@/components/ui/Button";
import { Pencil, Play, RotateCcw, Save } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import Textarea from "@/components/ui/Textarea";
import { Label } from "@/components/Label";
import { useUserSession } from "@/contexts/UserSessionContext";
import { useExecution } from "@/lib/useExecution";
import { useCallback, useState } from "react";

export default function TemplateCodeBody({
    template,
    isOwner,
    updateTemplate,
    loading,
    saveLoading,
}: {
    template: TemplateResponse,
    isOwner: boolean,
    updateTemplate: (updates: { code?: string; stdin?: string }) => Promise<void>,
    loading: boolean,
    saveLoading: boolean,
}
) {

    const { baseUrl } = useUserSession();
    const { status, stdout, stderr, runError, run, resetExecutionStatus } = useExecution(baseUrl);

    // --- Editor state (initialised from template on load) ---
    const [code, setCode] = useState<string>(template.code);
    const [stdin, setStdin] = useState<string>(template.stdin);

    const [editingStdin, setEditingStdin] = useState(false);

    // const isMutated = (template.code !== code) || (template.stdin !== stdin);
    const isCodeMutated = (template.code !== code);
    const isStdinMutated = (template.stdin !== stdin);

    const executeCode = useCallback(() => {
        run(code, template.language, stdin);
    }, [code, template.language, stdin, run]);

    const cancelCodeEdit = useCallback(() => {
        if (!template) return;
        setCode(template.code);
        resetExecutionStatus();
    }, [resetExecutionStatus, template.code]);


    const cancelStdinEdit = useCallback(() => {
        setStdin(template.stdin);
        setEditingStdin(false);
    }, [template.stdin]);

    const handleSave = useCallback(async (code: string, stdin: string) => {
        await updateTemplate({ code, stdin });
        setEditingStdin(false);
    }, [updateTemplate]);

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
                            {isCodeMutated && <Button variant="ghost" size="sm" onClick={cancelCodeEdit} disabled={loading || !template}>
                                <RotateCcw className="size-4" /> Reset
                            </Button>}


                            {isOwner && (isStdinMutated || isCodeMutated) && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSave(code, stdin)}
                                    disabled={saveLoading || loading || !template}
                                >
                                    <Save className="size-4" /> Save Changes
                                </Button>
                            )}

                            <Button size="sm" onClick={executeCode} disabled={loading || status === 'running'}>
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
                                    <Button variant="edit" onClick={() => setEditingStdin(true)}>
                                        <Pencil className="size-3" /> Edit
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