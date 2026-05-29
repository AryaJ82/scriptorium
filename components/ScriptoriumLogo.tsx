import { Feather } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ScriptoriumLogo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Feather className="size-4.5" strokeWidth={2.25} />
      </span>
      {showWordmark && (
        <span className="font-serif text-lg font-semibold tracking-tight">
          Scriptorium
        </span>
      )}
    </span>
  )
}
