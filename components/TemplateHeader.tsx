'use client'

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { GitFork, Menu, Pencil, GitBranch, Trash, Bookmark, MessageSquare } from "lucide-react";
import { TemplateResponse } from "@/utils/interfaces";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { useCallback, useState } from "react";
import Link from "next/link";
import { DisplayAvatar } from "@/components/ui/Avatar";
import ActionDialogue from "./ui/ActionDialog";
import { TagBadge } from "./TagBadge";
import { SaveBlogDialogue } from "./SaveBlogDialogue";
import { useTagEdit } from "@/lib/useTagEdit";
import { useRouter } from "next/navigation";

export default function TemplateHeader({
    template,
    isOwner,
    onSaveTitle,
    onSaveTags,
    onDelete,
    onFork,
    onToggleSaved,
    isSavedByCurrentUser
}: {
    template: TemplateResponse;
    isOwner: boolean;
    onSaveTitle: (title: string) => Promise<void>;
    onSaveTags: (tags: string[]) => Promise<void>;
    onDelete: () => Promise<void>;
    onFork: () => Promise<void>;
    onToggleSaved: () => void;
    isSavedByCurrentUser: boolean;

}) {
    const [title, setTitle] = useState(template.title);
    const { tagDraft, setTagDraft, tags, setTags, addTag, removeTag } = useTagEdit(template.tags.map((tag) => tag.name));

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [isTemplateSaving, setIsTemplateSaving] = useState(false);
    const [isTitleSaving, setIsTitleSaving] = useState(false);
    const [tagsSaving, setTagsSaving] = useState(false);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [isForkOpen, setIsForkOpen] = useState(false);
    const [forkLoading, setForkLoading] = useState(false);

    const [isBlogReplyOpen, setIsBlogReplyOpen] = useState(0);
    const [isBlogReplyLoading, setIsBlogReplyLoading] = useState(false);

    const router = useRouter();
    // ---------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------


    /// ---  Tag editing handlers ---

    const cancelTagsEdit = useCallback(() => {
        setTags(template.tags.map((tag) => tag.name));
        setTagDraft('');
        setIsEditingTags(false);
    }, [template.tags, setTags, setTagDraft]);

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
        setTitle(template.title);
        setIsEditingTitle(false);
    }, [template.title]);


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
    const toggleSavedState = useCallback(async () => {
        setIsTemplateSaving(true);
        try {
            await onToggleSaved();
        } finally {
            setIsTemplateSaving(false);
        }
    }, [onToggleSaved]);

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

    const confirmFork = useCallback(async () => {
        setForkLoading(true);
        try {
            await onFork();
            setIsForkOpen(false);
        } finally {
            setForkLoading(false);
        }
    }, [onFork]);


    return (
        <div className="mb-6 flex flex-col gap-3">

            <div className="flex flex-row items-center justify-between">
                {/* Author */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium"> by </span>
                    <Button
                        className="flex items-center gap-2 rounded-full outline-none border border-border p-1 pr-3"
                        aria-label="Visit Author Profile"
                        variant='ghost'
                        onClick={() => { router.push(`users/${template.author.username}`) }}
                    >

                        <DisplayAvatar user={template.author} size="md" />
                        <span className="text-sm font-medium">{template.author.username}</span>
                    </Button>
                </div>

                <span className="flex items-center gap-2">
                    {isSavedByCurrentUser && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <Bookmark className="size-3" /> Saved
                        </span>
                    )}
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

                            <DropdownMenuItem onClick={() => toggleSavedState()} disabled={isTemplateSaving}>
                                <Bookmark className="size-3" /> {isSavedByCurrentUser ? 'Unsave Template' : 'Save Template'}
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => setIsBlogReplyOpen(n => n+1)} disabled={isBlogReplyLoading}>
                                <MessageSquare className="size-3" /> Reply with Blog Post
                            </DropdownMenuItem>


                            <DropdownMenuItem onClick={() => setIsForkOpen(true)} disabled={forkLoading || isForkOpen}>
                                <GitBranch className="size-3" /> Fork Template
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            {isOwner && (
                                <>
                                    <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)} disabled={deleteLoading || isDeleteOpen}>
                                        <Trash className="size-3" /> Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </span>
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
            
            <SaveBlogDialogue
                key={isBlogReplyOpen} // Force remount to reset internal state when reopening
                linkedTemplateId={template.id}
                defaultOpen={!!isBlogReplyOpen}
            >
                <div></div>
            </SaveBlogDialogue>


            <div className="flex flex-col items-start gap-2">

                <div className="flex flex-col gap-2 min-w-0">
                    {isOwner ? (
                        <div className="flex flex-col gap-2 w-full">
                            {isEditingTitle ? (
                                <div className="flex gap-2">
                                    <Textarea
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="text-3xl font-serif font-semibold tracking-tight border-0 bg-transparent px-0 py-0 focus-visible:ring-0 focus-visible:border-transparent resize-none overflow-hidden w-full leading-tight"
                                        aria-label="Template title"
                                        rows={1}
                                    />
                                    <div className="flex flex-col justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={cancelTitleEdit} disabled={isTitleSaving}>
                                            Cancel
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={saveTitle} disabled={isTitleSaving || !title.trim()}>
                                            {isTitleSaving ? 'Saving…' : 'Save'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2">
                                    <h1 className="font-serif text-3xl font-semibold tracking-tight break-all leading-tight">
                                        {template.title}
                                    </h1>
                                    <Button variant="edit" onClick={() => setIsEditingTitle(true)}>
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
                                    Forked from template <u>{template.parentTemplate.title} </u>
                                </p>
                            </span>
                        </Link>
                    )}
                </div>

            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">

                    {!isOwner && !isEditingTags && template.tags.length > 0 && (
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
                                {template.tags.map((tag) => (
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
    );
}
