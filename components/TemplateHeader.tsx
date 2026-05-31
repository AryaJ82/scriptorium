'use client'

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { GitFork, X } from "lucide-react";
import { TemplateResponse } from "@/utils/interfaces";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

export default function TemplateHeader({
    template,
    isOwner,
}: {
    template: TemplateResponse;
    isOwner: boolean;
}) {
    const author = template.author;
    const [title, setTitle] = useState(template?.title ?? '');
    const [tags, setTags] = useState<string[]>([]);
    const [tagDraft, setTagDraft] = useState('');
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingTags, setEditingTags] = useState(false);

    
        // ---------------------------------------------------------------------------
        // Actions
        // ---------------------------------------------------------------------------
    
        const addTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
            if ((e.key === 'Enter' || e.key === ',') && tagDraft.trim()) {
                e.preventDefault();
                const nextTag = tagDraft.trim().replace(/^#/, '');
                if (!tags.includes(nextTag)) {
                    setTags([...tags, nextTag]);
                }
                setTagDraft('');
            }
        }, [tagDraft, tags]);
    
        const removeTag = useCallback((tag: string) => {
            setTags(tags.filter((current) => current !== tag));
        }, [tags]);
    
        const cancelTitleEdit = useCallback(() => {
            if (!template) return;
            setTitle(template.title);
            setEditingTitle(false);
        }, [template]);
    
        const cancelTagsEdit = useCallback(() => {
            if (!template) return;
            setTags(template.tags.map((tag) => tag.name));
            setTagDraft('');
            setEditingTags(false);
        }, [template]);
    
    return (
        <div className="mb-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-2 min-w-0">
                    {isOwner ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {editingTitle ? (
                                <>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="text-3xl font-serif font-semibold tracking-tight border-0 bg-transparent px-0 py-0 focus-visible:ring-0 focus-visible:border-transparent"
                                        aria-label="Template title"
                                    />
                                    <Button variant="ghost" size="sm" onClick={cancelTagsEdit}>
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <h1 className="font-serif text-3xl font-semibold tracking-tight">
                                        {template.title}
                                    </h1>
                                    <Button variant="ghost" size="sm" onClick={() => setEditingTitle(true)}>
                                        Edit
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <h1 className="font-serif text-3xl font-semibold tracking-tight">
                            {template.title}
                        </h1>
                    )}

                    {template.parentTemplate && (
                        <Link href={`/templates/${template.parentTemplate.id}`}>
                            <span className="inline-flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground">
                                <GitFork className="size-3.5" />
                                <p className="text-sm text-muted-foreground">
                                    {template.parentTemplate.title}
                                </p>
                            </span>
                        </Link>
                    )}
                </div>

                {/* Author */}
                <button
                    className="flex items-center rounded-full outline-none ring-ring focus-visible:ring-2"
                    aria-label="Visit Author Profile"
                    onClick={() => { }}
                >
                    <Avatar className="size-10 border">
                        {author.avatarUrl ? ( <AvatarImage src={author.avatarUrl} alt="" /> ) : null}
                        <AvatarFallback className="text-xs font-large">
                            {author.username.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    {template.isForked && template.parentTemplate && (
                        <a
                            href={`/templates/${template.parentTemplate.id}`}
                            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                        >
                            Forked from: {template.parentTemplate.title}
                        </a>
                    )}

                    {!isOwner && template.tags.length > 0 && (
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

                {isOwner && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">

                            {editingTags ? (
                                <Button variant="ghost" size="sm" onClick={cancelTagsEdit}>
                                    Cancel
                                </Button>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={() => setEditingTags(true)}>
                                    Edit tags
                                </Button>
                            )}
                        </div>
                        {editingTags ? (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex flex-wrap gap-1">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground transition hover:bg-muted/80"
                                        >
                                            #{tag}
                                            <X className="size-3" />
                                        </button>
                                    ))}
                                </div>

                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {editingTags && <div className="min-w-0 flex-1">
                            <Input
                                id="template-tags"
                                value={tagDraft}
                                onChange={(e) => setTagDraft(e.target.value)}
                                onKeyDown={addTag}
                                placeholder="Add a tag and press Enter"
                            />
                        </div>}
                    </div>
                )}
            </div>
        </div>
    );
}
