export type ExecutionRunStatus = "success" | "error" | "timeout";

export interface ExecutionResult {
    runStatus: ExecutionRunStatus;
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
}
