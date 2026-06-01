'use client'

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { GitFork, X, Menu, Pencil, GitBranch, Trash } from "lucide-react";
import { TemplateResponse } from "@/utils/interfaces";
import { Toaster, toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { validateTagValue } from "@/utils/inputValidation/generalValidation";
import ActionDialogue from "./ui/ActionDialog";

export default function TemplateHeader({
    template,
    isOwner,
    onSaveTitle,
    onSaveTags,
    setSaveError,
    setDeleteError,
    setForkError,
    onDelete,
    onFork,
}: {
    template: TemplateResponse;
    isOwner: boolean;
    onSaveTitle: (title: string) => Promise<void>;
    onSaveTags: (tags: string[]) => Promise<void>;
    setSaveError: (saveError: string | null) => void;
    setDeleteError: (deleteError: string | null) => void;
    setForkError: (forkError: string | null) => void;
    onDelete: () => Promise<void>;
    onFork: () => Promise<void>;
}) {
    const author = template.author;
    const [title, setTitle] = useState(template.title);
    const [tags, setTags] = useState<string[]>(template.tags.map((tag) => tag.name));
    const [tagDraft, setTagDraft] = useState('');
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingTags, setEditingTags] = useState(false);
    const [titleSaving, setTitleSaving] = useState(false);
    const [tagsSaving, setTagsSaving] = useState(false);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [isForkOpen, setIsForkOpen] = useState(false);
    const [forkLoading, setForkLoading] = useState(false);
    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------

    const addTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>, tagDraft: string) => {
        if ((e.key === 'Enter' || e.key === ',' || e.key === "#" || e.key === ' ' || e.key === '&' || e.key === '$') && tagDraft.trim()) {
            e.preventDefault();
            const newTag = tagDraft.trim().toLowerCase();
            const error = validateTagValue(newTag);
            if (error) {
                toast.error(error.message);
                return;
            }
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagDraft('');
        }
    }, [tags]);

    const removeTag = useCallback((tag: string) => {
        setTags(tags.filter((current) => current !== tag));
    }, [tags]);

    const cancelTitleEdit = useCallback(() => {
        setTitle(template.title);
        setEditingTitle(false);
    }, [template.title]);

    const cancelTagsEdit = useCallback(() => {
        setTags(template.tags.map((tag) => tag.name));
        setTagDraft('');
        setEditingTags(false);
    }, [template.tags]);

    const saveTitle = useCallback(async () => {
        if (!onSaveTitle) {
            setEditingTitle(false);
            return;
        }
        setTitleSaving(true);
        try {
            await onSaveTitle(title);
            setEditingTitle(false);
        } finally {
            setTitleSaving(false);
        }
    }, [onSaveTitle, title]);

    const saveTags = useCallback(async () => {
        setTagsSaving(true);
        try {
            await onSaveTags(tags);
            setEditingTags(false);
        } finally {
            setTagsSaving(false);
        }
    }, [onSaveTags, tags]);


    const confirmDelete = useCallback(async () => {
        setDeleteLoading(true);
        try {
            await onDelete();
        } catch (err: any) {
            setSaveError(err?.message || 'Failed to delete template.');
        } finally {
            setDeleteLoading(false);
            setIsDeleteOpen(false);
        }
    }, [onDelete, setSaveError]);

    const confirmFork = useCallback(async () => {
        setForkLoading(true);
        try {
            await onFork();
        } catch (err: any) {
            setForkError(err?.message || 'Failed to fork template.');
        } finally {
            setForkLoading(false);
            setIsForkOpen(false);
        }
    }, [onFork, setForkError]);


    return (
        <div className="mb-6 flex flex-col gap-3">

            <div className="flex flex-row items-center justify-between">
                {/* Author */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium"> by </span>
                    <button
                        className="flex items-center gap-2 rounded-full outline-none border border-border p-1 pr-3"
                        aria-label="Visit Author Profile"
                        onClick={() => { }}
                    >

                        <Avatar className="size-8 border">
                            {author.avatarUrl ? (<AvatarImage src={author.avatarUrl} alt="" />) : null}
                            <AvatarFallback className="text-xs font-large">
                                {author.username.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{author.username}</span>
                    </button>
                </div>
                {/* Burger Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="flex items-center justify-center rounded-md outline-none border border-border p-2 hover:bg-accent"
                            aria-label="Template actions"
                        >
                            <Menu className="size-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsForkOpen(true)} disabled={forkLoading}>
                            <GitBranch className="size-3" /> Fork Template
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {isOwner && (
                            <>
                                <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)} disabled={deleteLoading}>
                                    <Trash className="size-3" /> Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {isDeleteOpen && (
                <ActionDialogue
                    title={`Delete template "${template.title}"?`}
                    description="Are you sure you want to delete this template? This action cannot be undone."
                    confirmAction={confirmDelete}
                    isOpen={isDeleteOpen}
                    setIsOpen={setIsDeleteOpen}
                    actionLoading={deleteLoading}
                />
            )}
            {isForkOpen && (
                <ActionDialogue
                    title={`Fork template "${template.title}"?`}
                    description="Are you sure you want to fork this template?"
                    confirmAction={confirmFork}
                    isOpen={isForkOpen}
                    setIsOpen={setIsForkOpen}
                    actionLoading={forkLoading}
                />
            )}
            <div className="flex flex-col items-start gap-2">

                <div className="flex flex-col gap-2 min-w-0">
                    {isOwner ? (
                        <div className="flex flex-col gap-2 w-full">
                            {editingTitle ? (
                                <div className="flex gap-2">
                                    <Textarea
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="text-3xl font-serif font-semibold tracking-tight border-0 bg-transparent px-0 py-0 focus-visible:ring-0 focus-visible:border-transparent resize-none overflow-hidden w-full leading-tight"
                                        aria-label="Template title"
                                        rows={1}
                                    />
                                    <div className="flex flex-col justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={cancelTitleEdit} disabled={titleSaving}>
                                            Cancel
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={saveTitle} disabled={titleSaving || !title.trim()}>
                                            {titleSaving ? 'Saving…' : 'Save'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2">
                                    <h1 className="font-serif text-3xl font-semibold tracking-tight break-all leading-tight">
                                        {template.title}
                                    </h1>
                                    <Button variant="edit" onClick={() => setEditingTitle(true)}>
                                        <Pencil className="size-3" /> Edit Title
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <h1 className="font-serif text-3xl font-semibold tracking-tight break-all leading-tight">
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

                    {!isOwner && !editingTags && template.tags.length > 0 && (
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

                            {editingTags ? (
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
                                    <Button variant="edit" onClick={() => setEditingTags(true)}>
                                        <Pencil className="size-3" /> Edit Tags
                                    </Button>
                                </div>
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

                        {editingTags && <div className="min-w-0 flex-1">
                            <Toaster richColors />
                            <Input
                                id="template-tags-input"
                                value={tagDraft}
                                onChange={(e) => setTagDraft(e.target.value)}
                                onKeyDown={(e) => addTag(e, tagDraft)}
                                placeholder="Add a tag and press Enter"
                            />

                        </div>}
                    </div>
                )}
            </div>
        </div>
    );
}
