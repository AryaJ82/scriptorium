'use client'

import { DisplayAvatar } from '@/components/ui/Avatar'
import { timeAgo } from '@/utils/timeAgo'
import { VoteButtons } from '@/components/ui/VoteButtons'
import type { BlogResponse } from "@/utils/interfaces"
import { TagBadge } from './TagBadge'
import { TemplateCard } from './TemplateCard'

export default function BlogHeader({ post }: { post: BlogResponse }) {
    return (
        <header className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                {post.linkedTemplate && (<p>This post is linked to the template,</p>)}
                {post.linkedTemplate && (<TemplateCard template={post.linkedTemplate} />)}
                {/* Author row */}
                <div className="flex items-center gap-3">
                    <DisplayAvatar user={post.author} size="md" />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium leading-none text-foreground">
                            {post.author.username}
                        </span>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-mono">@{post.author.username}</span>
                            <span className="mx-1.5 opacity-40">·</span>
                            Posted {timeAgo(post.createdAt as unknown as string)}
                        </p>
                    </div>
                </div>

                {/* Title */}
                <h1 className="font-serif text-3xl font-semibold tracking-tight break-all leading-tight">
                    {post.title}
                </h1>
                {/* ── Tags ── */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                            <TagBadge
                                label={tag.name}
                                key={tag.name}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop vote */}
            <div className="hidden shrink-0 sm:block">
                <VoteButtons
                    upvotes={post.upvoteCount}
                    downvotes={post.downvoteCount}
                    orientation="vertical"
                />
            </div>


        </header>
    )
}