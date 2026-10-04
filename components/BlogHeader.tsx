
    
  
'use client'

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { DisplayAvatar } from '@/components/ui/Avatar'
import { timeAgo } from '@/utils/timeAgo'
import type { BlogResponse, CommentResponse } from "@/utils/interfaces"
import { TagBadge } from './TagBadge'
import { TemplateCard } from './TemplateCard'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { useTagEdit } from "@/lib/useTagEdit";
import { useUserSession } from '@/contexts/UserSessionContext';
import { ReportDialog } from './ReportDialog';

import { useState, useCallback } from 'react';
import { Menu, Trash, Pencil, Flag } from 'lucide-react'
import Textarea from "./ui/Textarea";
import ActionDialogue from "./ui/ActionDialog";
import { VoteButtons } from "./ui/VoteButtons";


export default function BlogHeader({
    post,
    isOwner,
    onSaveTitle,
    onSaveTags,
    onDelete,
    setPost,
    handleActionError,
}: {
    post: BlogResponse
    isOwner: boolean;
    onSaveTitle: (title: string) => Promise<void>;
    onSaveTags: (tags: string[]) => Promise<void>;
    onDelete: () => Promise<void>;
    setPost: (b: BlogResponse) => void;
    handleActionError: (s: string) => void;
}) {
    const [title, setTitle] = useState(post.title);
    const { tagDraft, setTagDraft, tags, setTags, addTag, removeTag } = useTagEdit(post?.tags ? post.tags.map((tag) => tag.name) : []);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);

    const [isTitleSaving, setIsTitleSaving] = useState(false);
    const [tagsSaving, setTagsSaving] = useState(false);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const { session } = useUserSession();



    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------


    /// ---  Tag editing handlers ---

    const cancelTagsEdit = useCallback(() => {
        setTags(post.tags.map((tag) => tag.name));
        setTagDraft('');
        setIsEditingTags(false);
    }, [post.tags, setTags, setTagDraft]);

    const saveTags = useCallback(async () => {
        setTagsSaving(true);
        try {
            await onSaveTags(tags);
            setIsEditingTags(false);
        } finally {
            setTagsSaving(false);
        }
    }, [onSaveTags, tags]);

    // --- Title editing handlers ---
    const cancelTitleEdit = useCallback(() => {
        setTitle(post.title);
        setIsEditingTitle(false);
    }, [post.title]);


    const saveTitle = useCallback(async () => {
        setIsTitleSaving(true);
        try {
            await onSaveTitle(title);
            setIsEditingTitle(false);
        } finally {
            setIsTitleSaving(false);
        }
    }, [onSaveTitle, title]);

    // ----- Saving template

    // ---- Deletion and Forking handlers ---
    const confirmDelete = useCallback(async () => {
        setDeleteLoading(true);
        try {
            await onDelete();
            setIsDeleteOpen(false);
        } finally {
            setDeleteLoading(false);
        }
    }, [onDelete]);

    return (
        <header className="mb-6 flex flex-col gap-3 w-full">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                {post.linkedTemplate && (<p>This post is linked to the template,</p>)}
                {post.linkedTemplate && (<TemplateCard template={post.linkedTemplate} />)}
                <hr className="my-6 border-border/30" />
                {/* Author row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <p> By </p>
                        <DisplayAvatar user={post.author} size="md" />

                        <div className="flex flex-col gap-0.5">

                            <p className="text-s text-muted-foreground">
                                <span className="font-mono">@{post.author.username}</span>
                                <span className="mx-1.5 opacity-40">·</span>
                                Posted {timeAgo(post.createdAt as unknown as string)}
                            </p>
                        </div>
                    </div>

                    {/* Burger Menu */}
                    <div className="flex flex-row gap-1 items-end">
                        <div className="hidden shrink-0 sm:block">
                            <VoteButtons
                                post={post}
                                postType="blog"
                                orientation="horizontal"
                                updatePost={setPost as ((p: BlogResponse | CommentResponse) => void)}
                                handleActionError={handleActionError}
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center justify-center rounded-md border border-border p-2 outline-none hover:bg-accent"
                                    aria-label="Template actions"
                                >
                                    <Menu className="size-4" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                                <DropdownMenuSeparator />
                                {!isOwner && session.isAuthenticated && (
                                    <DropdownMenuItem onClick={() => setIsReportOpen(true)}>
                                        <Flag className="size-3" /> Report
                                    </DropdownMenuItem>
                                )}
                                {isOwner && (
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => setIsDeleteOpen(true)}
                                        disabled={deleteLoading || isDeleteOpen}
                                    >
                                        <Trash className="size-3" /> Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>


                    </div>
                </div>

                {/* Title */}

                <div className="flex flex-col items-start gap-2 w-full">

                    <div className="flex flex-col gap-2 min-w-0 w-full">
                        {isOwner ? (
                            <div className="flex flex-col gap-2 w-full">
                                {isEditingTitle ? (
                                    <div className="flex w-full max-w-3xl flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 shadow-sm sm:flex-row sm:items-end">
                                        <div className="flex shrink-0 gap-2 sm:flex-col">
                                            <Button className="flex-1 sm:flex-none" variant="ghost" size="sm" onClick={cancelTitleEdit} disabled={isTitleSaving}>
                                                Cancel
                                            </Button>
                                            <Button className="flex-1 sm:flex-none" variant="outline" size="sm" onClick={saveTitle} disabled={isTitleSaving || !title.trim()}>
                                                {isTitleSaving ? 'Saving…' : 'Save'}
                                            </Button>
                                        </div>
                                        <Textarea
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="min-h-12 min-w-0 flex-1 resize-none overflow-hidden rounded-lg border-border bg-background px-3 py-2.5 font-serif text-2xl font-semibold leading-tight tracking-tight shadow-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-3xl"
                                            aria-label="Blog post title"
                                            rows={2}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2">
                                        <h1 className="font-serif text-3xl font-semibold tracking-tight break-all leading-tight">
                                            {post.title}
                                        </h1>
                                        <Button variant="edit" onClick={() => setIsEditingTitle(true)}>
                                            <Pencil className="size-3" /> Edit Title
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <h1 className="font-serif text-3xl font-semibold tracking-tight break-all leading-tight">
                                {post.title}
                            </h1>
                        )}
                    </div>

                    <ReportDialog
                        open={isReportOpen}
                        onOpenChange={setIsReportOpen}
                        endpoint={`/api/blogs/${post.id}/reports`}
                        subjectLabel="blog post"
                    />

                    {/* ── Delete Dialog ── */}
                    <ActionDialogue
                        title={`Delete blog post "${post.title}"?`}
                        description="Are you sure you want to delete this blog post? This action cannot be undone."
                        confirmAction={confirmDelete}
                        isOpen={isDeleteOpen}
                        setIsOpen={setIsDeleteOpen}
                        actionLoading={deleteLoading}
                        actionLabel="Delete"
                    />

                    {/* ── Tags ── */}

                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">

                            {!isOwner && !isEditingTags && post.tags.length > 0 && (
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

                        </div>

                        {isOwner && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-2">

                                    {isEditingTags ? (
                                        <>
                                            <Button variant="ghost" size="sm" onClick={cancelTagsEdit} disabled={tagsSaving}>
                                                Cancel
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={saveTags} disabled={tagsSaving}>
                                                {tagsSaving ? 'Saving…' : 'Save'}
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Button variant="edit" onClick={() => setIsEditingTags(true)}>
                                                <Pencil className="size-3" /> Edit Tags
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {isEditingTags ? (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex flex-wrap gap-1">
                                            {tags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="mt-auto flex flex-wrap items-center gap-1.5 pt-1"
                                                >
                                                    <TagBadge key={tag} label={tag} deleteMode={true} />
                                                </button>
                                            ))}
                                        </div>

                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {post.tags.map((tag) => (
                                            <TagBadge key={tag.name} label={tag.name} />
                                        ))}
                                    </div>
                                )}

                                {isEditingTags && <div className="min-w-0 flex-1">
                                    <Input
                                        id="template-tags-input"
                                        value={tagDraft}
                                        onChange={(e) => setTagDraft(e.target.value)}
                                        onKeyDown={(e) => addTag(e)}
                                        placeholder="Add a tag and press Enter"
                                    />

                                </div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}

