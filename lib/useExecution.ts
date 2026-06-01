import { useCallback, useState } from "react";
import { type RunStatus } from "@/components/OutputConsole";

export function useExecution(baseUrl: string) {
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

    const resetExecutionStatus = useCallback(() => {
        setStatus('idle');
        setStdout('');
        setStderr('');
        setRunError(null);
    }, []);

    return { status, stdout, stderr, runError, run, resetExecutionStatus };
}
