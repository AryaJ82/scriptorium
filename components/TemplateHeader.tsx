'use client'

import type { TemplateResponse } from "@/utils/interfaces";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";


export default function TemplateHeader({ template }: { template: TemplateResponse }) {
    const author = template.author;
    return (
        <div className="mb-6 flex flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <h1 className="font-serif text-3xl font-semibold tracking-tight">
                        {template.title}
                    </h1>
                    {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                </div>

                {/* Author */}
                <button
                    className="flex items-center rounded-full outline-none ring-ring focus-visible:ring-2"
                    aria-label="Visit Author Profile"
                    onClick={() => {}}
                >
                    <Avatar className="size-10 border">
                        {author.avatarUrl ? (
                            <AvatarImage src={author.avatarUrl} alt="" />
                        ) : null}
                        <AvatarFallback className="text-xs font-large">
                            {author.username.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {/* Fork lineage */}
                {template.isForked && template.parentTemplate && (
                    <a
                        href={`/templates/${template.parentTemplate.id}`}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                        Forked from: {template.parentTemplate.title}
                    </a>
                )}

                {/* Tags */}
                {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {template.tags.map((tag) => (
                            <span
                                key={tag.name}
                                className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                            >
                                #{tag.name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}