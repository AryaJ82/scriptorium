import { NextResponse, NextRequest } from "next/server";
import os from "os";
import fs from 'fs';
import path from "path";
import Docker from 'dockerode';
import { PassThrough } from 'stream';
import type { ExecutionRequestPOSTBody } from '@/utils/interfaces'

const docker = new Docker();

const TIME_LIMIT = !isNaN(Number(process.env.EXECUTION_TIMELIMIT_MS)) ? Number(process.env.EXECUTION_TIMELIMIT_MS) : 10000; // 10 seconds
const MEMORY_LIMIT = !isNaN(Number(process.env.MEMORY_LIMIT)) ? Number(process.env.MEMORY_LIMIT_MB) * 1024 * 1024 : 128 * 1024 * 1024; // 128 MB
const CPU_LIMIT = !isNaN(Number(process.env.CPU_LIMIT)) ? Number(process.env.CPU_LIMIT) : 0.5; // 0.5 CPU
import { MAX_CODE_SIZE } from "@/utils/inputValidation/generalValidation";
const MAX_STDIN_SIZE = !isNaN(Number(process.env.MAX_STDIN_SIZE_KB)) ? Number(process.env.MAX_STDIN_SIZE_KB) * 1024 : 64 * 1024;
const MAX_OUTPUT_SIZE = !isNaN(Number(process.env.MAX_OUTPUT_SIZE_KB)) ? Number(process.env.MAX_OUTPUT_SIZE_KB) * 1024 : 64 * 1024;

type Language = keyof typeof LANG_CONFIG;
export type { Language };

const LANG_CONFIG = {
    PYTHON: { fileName: "main.py", image: 'python:3.13-alpine', cmd: ['sh', '-c', 'python3 /code/main.py < /code/stdin.txt'] },
    JAVASCRIPT: { fileName: "main.js", image: 'node:23-alpine', cmd: ['sh', '-c', 'node /code/main.js < /code/stdin.txt'] },
    C: { fileName: "main.c", image: 'gcc:14', cmd: ['sh', '-c', 'gcc /code/main.c -o /tmp/main && /tmp/main < /code/stdin.txt'] },
    CPP: { fileName: "main.cpp", image: 'gcc:14', cmd: ['sh', '-c', 'g++ /code/main.cpp -o /tmp/main && /tmp/main < /code/stdin.txt'] },
    JAVA: { fileName: "main.java", image: 'eclipse-temurin:24-jdk-alpine', cmd: ['sh', '-c', 'javac -d /tmp /code/main.java && java -cp /tmp main < /code/stdin.txt'] }
};


export async function GET(request: NextRequest) {
    return NextResponse.json({ message: "Hello from the execution API!" });
}

export async function POST(request: NextRequest) {
    const body: ExecutionRequestPOSTBody = await request.json();
    const { language, code, stdin } = body;

    if (!language || !(language in LANG_CONFIG)) {
        return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    } else if (!code) {
        return NextResponse.json({ error: "Code is required" }, { status: 400 });
    } else if (Buffer.byteLength(code) > MAX_CODE_SIZE) {
        return NextResponse.json({ error: "Code exceeds maximum size" }, { status: 400 });
    } else if (stdin && Buffer.byteLength(stdin) > MAX_STDIN_SIZE) {
        return NextResponse.json({ error: "Stdin exceeds maximum size" }, { status: 400 });
    }

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
        return NextResponse.json({ error: `Failed to create temp directory or write to file: ${error}` }, { status: 500 });
    }

    let container: Docker.Container | undefined;
    let stdout = '';
    let stderr = '';

    // Execute submitted code
    try {
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
                Memory: MEMORY_LIMIT,
                CpuQuota: CPU_LIMIT * 100_000,   // 1 CPU = 100% of 100ms period
                CpuPeriod: 100_000,
                SecurityOpt: ['no-new-privileges'],
                ReadonlyRootfs: true,
                Tmpfs: { '/tmp': 'size=64m,exec' },
            },
        });

        if (!container) {
            return NextResponse.json({ error: "Failed to create execution container" }, { status: 500 });
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
        stderrStream.on('data', (d: Buffer) => stderr += d.toString());
        stdoutStream.on('data', (d: Buffer) => {
            if (Buffer.byteLength(stdout) + d.length > MAX_OUTPUT_SIZE) {
                container?.kill().catch(() => { });
                throw new Error("OUTPUT_LIMIT_EXCEEDED");
            }
            stdout += d.toString()
        });

        // Begin execution
        await container.start();

        const exitCode = await Promise.race([
            container.wait().then((res: { StatusCode: number }) => res.StatusCode),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('TIME_OUT')), TIME_LIMIT)
            ),
        ]);

        if (stderr.endsWith("EOFError: EOF when reading a line\n")) {
            return NextResponse.json({ stdout: stdout, error: "Execution failed due to discrepancy in required argument length" });
        }

        return NextResponse.json({ stdout, stderr, exitCode });

    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message === "TIME_OUT") {
            return NextResponse.json({ stdout: stdout, error: "Execution timed out" }, { status: 408 });
        } else if (message === "OUTPUT_LIMIT_EXCEEDED") {
            return NextResponse.json({ stdout: stdout, error: "Code output exceeded limit" }, { status: 413 });
        }

        return NextResponse.json({ error: `Internal Error During Execution ${message}` }, { status: 500 });

    } finally {
        // Clean up temp directory
        await Promise.all([
            container?.remove({ force: true }).catch((err) => { console.error(`Error during container removal: ${err.message}`) }),
            workDir ? fs.promises.rm(workDir, { recursive: true, force: true }).catch((err) => { console.error(`Error during container removal: ${err?.message}`) }) : Promise.resolve()
        ]);
    }
}
