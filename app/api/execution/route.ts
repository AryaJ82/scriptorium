import { NextRequest } from "next/server";
import os from "os";
import fs from 'fs';
import path from "path";
import Docker from 'dockerode';
import { PassThrough } from 'stream';
import { validateExecutionPOSTBody } from "@/utils/inputValidation/executionValidation";

import { LANG_CONFIG } from "@/utils/interfaces";
import { apiError, apiSuccess } from "@/utils/apiResponse";
import { positiveFiniteEnv, positiveIntegerEnv } from "@/utils/inputValidation/executionValidation";

const EXECUTION_LIMITS = {
    timeMs: positiveFiniteEnv("EXECUTION_TIMELIMIT_MS", 10_000),
    memoryBytes: positiveFiniteEnv("MEMORY_LIMIT_MB", 128, 1024 * 1024, true),
    cpuQuota: positiveFiniteEnv("CPU_LIMIT", 0.5, 100_000, true),
    pids: positiveIntegerEnv("EXECUTION_PIDS_LIMIT", 64),
    outputBytes: positiveFiniteEnv("MAX_OUTPUT_SIZE_KB", 64, 1024),
};

const docker = new Docker();
const imagePulls = new Map<string, Promise<void>>();

function isDockerNotFound(error: unknown): boolean {
    return typeof error === "object"
        && error !== null
        && "statusCode" in error
        && error.statusCode === 404;
}

async function ensureImageAvailable(image: string): Promise<void> {
    try {
        await docker.getImage(image).inspect();
        return;
    } catch (error) {
        if (!isDockerNotFound(error)) {
            throw error;
        }
    }

    let pull = imagePulls.get(image);
    if (!pull) {
        pull = (async () => {
            const stream = await docker.pull(image);
            await new Promise<void>((resolve, reject) => {
                docker.modem.followProgress(stream, (error: Error | null) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        })();
        imagePulls.set(image, pull);
    }

    try {
        await pull;
    } finally {
        if (imagePulls.get(image) === pull) {
            imagePulls.delete(image);
        }
    }
}

export async function POST(request: NextRequest) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return apiError("Invalid JSON request body", 400);
    }
    const validation = validateExecutionPOSTBody(body);
    if (!validation.success) {
        return apiError(validation.error.message, validation.error.status);
    }
    const { language, code, stdin } = validation.data;

    const { fileName, image, cmd } = LANG_CONFIG[language];

    // Attempt to make directories
    let workDir: string | undefined;
    try {
        workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "run_"));

        await Promise.all([
            fs.promises.writeFile(path.join(workDir, fileName), code, { mode: 0o444 }), // read-only
            fs.promises.writeFile(path.join(workDir, "stdin.txt"), stdin || '', { mode: 0o444 }) // read-only
        ]);
    } catch (error) {
        return apiError(`Failed to create temp directory or write to file: ${error}`, 500);
    }

    let container: Docker.Container | undefined;
    let stdout = '';
    let stderr = '';
    let outputBytes = 0;

    // Execute submitted code
    try {
        await ensureImageAvailable(image);
        container = await docker.createContainer({
            Image: image,
            Cmd: cmd,
            AttachStdin: false, // stdin is provided via file, not interactive
            AttachStdout: true,
            AttachStderr: true,
            OpenStdin: false,
            StdinOnce: false,
            Tty: false,            // False so dockerode can demux stdout/stderr
            NetworkDisabled: true,
            User: '1000',
            HostConfig: {
                Binds: [`${workDir}:/code:ro`],
                Memory: EXECUTION_LIMITS.memoryBytes,
                CpuQuota: EXECUTION_LIMITS.cpuQuota,   // 1 CPU = 100% of 100ms period
                CpuPeriod: 100_000,
                PidsLimit: EXECUTION_LIMITS.pids,
                SecurityOpt: ['no-new-privileges'],
                ReadonlyRootfs: true,
                Tmpfs: { '/tmp': 'size=64m,exec' },
            },
        });

        if (!container) {
            return apiError("Failed to create execution container", 500);
        }

        const stream = await container.attach({
            stream: true,
            stdin: false,
            stdout: true,
            stderr: true,
        });

        // Demux the multiplexed docker stream into stdout/stderr
        const stdoutStream = new PassThrough();
        const stderrStream = new PassThrough();
        container.modem.demuxStream(stream, stdoutStream, stderrStream);

        // Surface an output-limit breach as a rejected promise instead of throwing
        // inside the stream handler (which would escape the surrounding try/catch).
        let outputLimitExceeded = false;
        let rejectOutputLimit: (err: Error) => void = () => { };
        const outputLimitPromise = new Promise<never>((_, reject) => {
            rejectOutputLimit = reject;
        });

        const appendOutput = (destination: 'stdout' | 'stderr', chunk: Buffer) => {
            if (outputBytes + chunk.length > EXECUTION_LIMITS.outputBytes) {
                if (!outputLimitExceeded) {
                    outputLimitExceeded = true;
                    container?.kill().catch(() => { });
                    rejectOutputLimit(new Error("OUTPUT_LIMIT_EXCEEDED"));
                }
                return;
            }
            outputBytes += chunk.length;
            if (destination === 'stdout') {
                stdout += chunk.toString();
            } else {
                stderr += chunk.toString();
            }
        };
        stderrStream.on('data', (chunk: Buffer) => appendOutput('stderr', chunk));
        stdoutStream.on('data', (chunk: Buffer) => appendOutput('stdout', chunk));

        // Begin execution
        await container.start();

        const exitCode = await Promise.race([
            container.wait().then((res: { StatusCode: number }) => res.StatusCode),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('TIME_OUT')), EXECUTION_LIMITS.timeMs)
            ),
            outputLimitPromise,
        ]);

        return apiSuccess({
            runStatus: exitCode === 0 ? "success" : "error",
            stdout,
            stderr,
            exitCode,
            timedOut: false,
        });

    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message === "TIME_OUT") {
            return apiSuccess({
                runStatus: "timeout",
                stdout,
                stderr,
                exitCode: null,
                timedOut: true,
            });
        } else if (message === "OUTPUT_LIMIT_EXCEEDED") {
            const error = "Code output exceeded limit";
            return apiError(error, 413, {
                runStatus: "error",
                stdout,
                stderr: stderr || error,
                exitCode: null,
                timedOut: false,
            });
        }

        return apiError(`Internal Error During Execution ${message}`, 500, { stdout, stderr });

    } finally {
        // Clean up temp directory
        await Promise.all([
            container?.remove({ force: true }).catch((err) => { console.error(`Error during container removal: ${err.message}`) }),
            workDir ? fs.promises.rm(workDir, { recursive: true, force: true }).catch((err) => { console.error(`Error during container removal: ${err?.message}`) }) : Promise.resolve()
        ]);
    }
}
