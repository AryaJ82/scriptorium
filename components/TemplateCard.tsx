'use client'

import Link from 'next/link'
import { GitFork, Bookmark, BookmarkCheck } from 'lucide-react'
import type { TemplateResponse } from '@/utils/interfaces'
import { LanguageBadge, TagBadge } from './TagBadge'

import { timeAgo } from '@/utils/timeAgo';


export function TemplateCard({ template }: { template: TemplateResponse }) {
  const isSavedByCurrentUser = !!template.savers && template.savers.length > 0;
  return (
    <Link
      href={`/templates/${template.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <LanguageBadge language={template.language} />
        {isSavedByCurrentUser !== undefined && (
          isSavedByCurrentUser ? (
            <BookmarkCheck className="size-4 text-primary" aria-label="Saved template" />
          ) : (
            <Bookmark className="size-4 text-muted-foreground/60" aria-label="Not saved" />
          )
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-serif text-lg font-medium leading-snug text-balance group-hover:text-primary">
          {template.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {template.description}
        </p>
      </div>

      {template.parentTemplate && (
        <span className="inline-flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <GitFork className="size-3.5" />
          forked from
          <Link
            href={`/templates/${template.parentTemplate.id}`}
            className="transition-colors hover:text-primary"
          >
            {template.parentTemplate.title}
          </Link>
        </span>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        {template.tags.slice(0, 3).map((tag) => (
          <TagBadge key={tag.name} label={tag.name} />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
        <span className="font-mono">@{template.author.username}</span>
        <span>{timeAgo(template.updatedAt as unknown as string)}</span>
      </div>
    </Link>
  )
}
