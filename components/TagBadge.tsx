import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Language, LANG_CONFIG } from '@/utils/interfaces'
import { X } from 'lucide-react'

export function TagBadge({
    label,
    href,
    className,
    deleteMode = false,
}: {
    label: string
    href?: string
    className?: string
    deleteMode?: boolean
}) {
    const classes = cn(
        'inline-flex items-center rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 font-mono text-xs text-secondary-foreground transition-colors hover:border-primary/50 hover:text-foreground',
        className,
    )
    if (href) {
        return (
            <Link href={href} className={classes}>
                #{label}
            </Link>
        )
    }
    return <span className={classes}> {deleteMode && <X className="size-3" />} #{label}</span>
}

export function LanguageBadge({
    language,
    className,
}: {
    language: Language
    className?: string
}) {
    //const lang = LANGUAGES.find((l) => l.id === language)
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-0.5 font-mono text-xs text-muted-foreground',
                className,
            )}
        >
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            {LANG_CONFIG[language].displayLabel}
        </span>
    )
}
