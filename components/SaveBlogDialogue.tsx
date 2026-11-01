'use client'

import Link from 'next/link'
import { useCallback, useState, type SubmitEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUserSession } from '@/contexts/UserSessionContext'
import { useTagEdit } from '@/lib/useTagEdit'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/Dialog'
import { Button } from './ui/Button'
import { Label } from './Label'
import Textarea from './ui/Textarea'
import Input from './ui/Input'
import { TagBadge } from './TagBadge'

interface SaveBlogDialogueOptions {
    initialTitle?: string
    initialContent?: string
    linkedTemplateId?: string
}

type SaveBlogDialogueProps = SaveBlogDialogueOptions & (
    | {
        children: React.ReactNode
        defaultOpen?: boolean
        open?: never
        onOpenChange?: never
    }
    | {
        children?: never
        defaultOpen?: never
        open: boolean
        onOpenChange: (open: boolean) => void
    }
)

export function SaveBlogDialogue(props: SaveBlogDialogueProps) {
    const {
        children,
        initialTitle = '',
        initialContent = '',
        linkedTemplateId,
    } = props
    const controlledOpen = props.open
    const onOpenChange = props.onOpenChange
    const { session, authFetch } = useUserSession()
    const [internalOpen, setInternalOpen] = useState(
        'defaultOpen' in props ? props.defaultOpen ?? false : false,
    )
    const isControlled = controlledOpen !== undefined
    const open = controlledOpen ?? internalOpen

    const setOpen = useCallback((nextOpen: boolean) => {
        if (!isControlled) setInternalOpen(nextOpen)
        onOpenChange?.(nextOpen)
    }, [isControlled, onOpenChange])

    const [title, setTitle] = useState(initialTitle)
    const [content, setContent] = useState(initialContent)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { tagDraft, setTagDraft, tags, addTag, removeTag } = useTagEdit()

    const handleSubmit = useCallback(async (event: SubmitEvent) => {
        event.preventDefault()
        if (!title.trim() || !content.trim()) return
        setLoading(true)
        try {
            const response = await authFetch('/api/blogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content,
                    tags: tags,
                    linked_template_id: linkedTemplateId
                }),
            })
            const body = await response.json()
            if (!response.ok) throw new Error(body.error ?? 'Unable to create blog post.')
            router.push(`/blog/${body.data.id}`)
            setOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to create blog post.')
        } finally {
            setLoading(false)
        }
    }, [authFetch, content, linkedTemplateId, router, tags, title, setOpen])

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !loading && setOpen(nextOpen)}>
            {!isControlled && children && (
                <DialogTrigger asChild>{children}</DialogTrigger>
            )}
            <DialogContent>
                {!session.isAuthenticated ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create a blog post</DialogTitle>
                            <DialogDescription>
                                Creating posts is available to members. Create a free account to share your thoughts.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button asChild variant="outline">
                                <Link href="/users/login">Log in</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/users/register">Sign up</Link>
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create blog post</DialogTitle>
                            <DialogDescription>
                                Give your post a title, some content, and optional tags so others can find it.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="blog-title">Title</Label>
                                <Input
                                    id="blog-title"
                                    required
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    placeholder="e.g. Why binary search matters"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="blog-content">Content</Label>
                                <Textarea
                                    id="blog-content"
                                    required
                                    className="h-48 resize-none"
                                    placeholder="Write something interesting..."
                                    value={content}
                                    onChange={(event) => setContent(event.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="blog-tags">Tags</Label>
                                <Input
                                    id="blog-tags"
                                    value={tagDraft}
                                    onChange={(event) => setTagDraft(event.target.value)}
                                    onKeyDown={addTag}
                                    placeholder="Type a tag and press Enter"
                                />
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {tags.map((tag) => (
                                            <button key={tag} type="button" onClick={() => removeTag(tag)}>
                                                <TagBadge label={tag} deleteMode />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setOpen(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading || !title.trim() || !content.trim()}>
                                    {loading ? 'Creating…' : 'Create Post'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
