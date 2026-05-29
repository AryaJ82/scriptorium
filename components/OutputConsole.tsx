import { AlertTriangle, CircleCheck, Clock, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RunStatus = 'idle' | 'running' | 'success' | 'error' | 'timeout'

export function OutputConsole({
  status,
  stdout,
  stderr,
}: {
  status: RunStatus
  stdout: string
  stderr: string
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <Terminal className="size-3.5" /> Output
        </span>
        <StatusPill status={status} />
      </div>

      <div className="min-h-40 flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed">
        {status === 'idle' && (
          <p className="text-muted-foreground">
            Run your code to see the output here.
          </p>
        )}
        {status === 'running' && (
          <p className="text-muted-foreground">Executing…</p>
        )}
        {stdout && (
          <pre className="whitespace-pre-wrap wrap-break-word text-foreground">
            {stdout}
          </pre>
        )}
        {stderr && (
          <pre className="mt-2 whitespace-pre-wrap wrap-break-word text-destructive">
            {stderr}
          </pre>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: RunStatus }) {
  const map = {
    idle: { label: 'Ready', icon: Terminal, cls: 'text-muted-foreground' },
    running: { label: 'Running', icon: Clock, cls: 'text-primary' },
    success: { label: 'Exit 0', icon: CircleCheck, cls: 'text-chart-2' },
    error: { label: 'Error', icon: AlertTriangle, cls: 'text-destructive' },
    timeout: { label: 'Timed out', icon: Clock, cls: 'text-destructive' },
  } as const
  const { label, icon: Icon, cls } = map[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-xs', cls)}>
      <Icon className={cn('size-3.5', status === 'running' && 'animate-spin')} />
      {label}
    </span>
  )
}
