'use client'

import { DisplayAvatar } from '@/components/ui/Avatar'
import { timeAgo } from '@/utils/timeAgo'
import type { BlogResponse } from "@/utils/interfaces"
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
import { useState, useCallback } from 'react';
import { Menu, Trash } from 'lucide-react'

export default function BlogHeader({
    post,
    isOwner,
    onSaveTitle,
    onSaveTags,
    onDelete,
}: {
    post: BlogResponse
    isOwner: boolean;
    onSaveTitle: (title: string) => Promise<void>;
    onSaveTags: (tags: string[]) => Promise<void>;
    onDelete: () => Promise<void>;
}) {
    const [title, setTitle] = useState(post.title);
    const { tagDraft, setTagDraft, tags, setTags, addTag, removeTag } = useTagEdit(post.tags.map((tag) => tag.name));

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);

    const [isPostSaving, setIsPostSaving] = useState(false);
    const [isTitleSaving, setIsTitleSaving] = useState(false);
    const [tagsSaving, setTagsSaving] = useState(false);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);


    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------


    /// ---  Tag editing handlers ---

    const cancelTagsEdit = useCallback(() => {
        setTags(post.tags.map((tag) => tag.name));
        setTagDraft('');
        setIsEditingTags(false);
    }, [post.tags]);

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
        <header className="mb-6 flex flex-col gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                {post.linkedTemplate && (<p>This post is linked to the template,</p>)}
                {post.linkedTemplate && (<TemplateCard template={post.linkedTemplate} />)}
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


        </header>
    )
}