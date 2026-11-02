import { useCallback, useState } from "react";
import { type RunStatus } from "@/components/OutputConsole";
import { validateExecutionPOSTBody } from "@/utils/inputValidation/executionValidation";
import { Language } from "@/utils/interfaces";

export function useExecution(baseUrl: string) {
    const [status, setStatus] = useState<RunStatus>('idle');
    const [stdout, setStdout] = useState('');
    const [stderr, setStderr] = useState('');
    const [runError, setRunError] = useState<string | null>(null);

    const run = useCallback(async (code: string, language: Language, stdin: string) => {
        setStatus('running');
        setStdout('');
        setStderr('');
        setRunError(null);

        const validation = validateExecutionPOSTBody({ code, language, stdin });
        if (!validation.success) {
            setStatus('error');
            setRunError(validation.error.message);
            return;
        }
        try {
            const res = await fetch(`${baseUrl}/api/execution`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, language, stdin }),
            });
            const body = await res.json();
            const result = body.data;

            if (res.ok) {
                setStatus(result.runStatus);
                setStdout(result.stdout);
                setStderr(result.stderr);
            } else {
                setStatus("error");
                setStdout(result?.stdout ?? '');
                setStderr(result?.stderr ?? '');
                setRunError(body.error ?? "An error has occured.");
            }
        } catch {
            setStatus("error");
            setRunError("An error occurred while executing the code.");
        }
    }, [baseUrl]);

    const resetExecutionStatus = useCallback(() => {
        setStatus('idle');
        setStdout('');
        setStderr('');
        setRunError(null);
    }, []);

    return { status, stdout, stderr, runError, run, resetExecutionStatus };
}
