'use client'

import Link from 'next/link'
import { useCallback, useState, SubmitEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUserSession } from '@/contexts/UserSessionContext'
import { useTagEdit } from '@/lib/useTagEdit'
import { Language } from '@/utils/interfaces'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/Dialog'
import { Button } from './ui/Button'
import { Label } from './Label'
import Textarea from './ui/Textarea'
import Input from './ui/Input'
import { TagBadge } from './TagBadge'

interface SaveTemplateDialogueParams {
    children: React.ReactNode
    language: Language
    code?: string
    stdin?: string
    forkedParent?: { title: string; id: string }
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export const PLAYGROUND_TEMPLATE_DRAFT_KEY = 'scriptorium:template-draft'

export function SaveTemplateDialogue({
    children,
    language,
    code,
    stdin,
    forkedParent,
    open: controlledOpen,
    onOpenChange,
}: SaveTemplateDialogueParams) {
    const { session, authFetch } = useUserSession()
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = controlledOpen ?? internalOpen
    const setOpen = useCallback((nextOpen: boolean) => {
        if (!isControlled) setInternalOpen(nextOpen)
        onOpenChange?.(nextOpen)
    }, [isControlled, onOpenChange])
    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { tagDraft, setTagDraft, tags, addTag, removeTag } = useTagEdit()

    const preserveDraftForSignUp = () => {
        if (session.isAuthenticated) return
        try {
            window.sessionStorage.setItem(
                PLAYGROUND_TEMPLATE_DRAFT_KEY,
                JSON.stringify({ code, stdin, language }),
            )
        } catch {
            toast.error('Unable to preserve your code. Copy it before continuing to sign in.')
        }
    }

    const handleSubmit = useCallback(async (event: SubmitEvent) => {
        event.preventDefault()
        if (!title.trim()) return
        setLoading(true)
        try {
            const response = await authFetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim(), code, description: desc, stdin, language, tags, ...(forkedParent && { forkedSourceId: forkedParent.id }) }) })
            const body = await response.json()
            if (!response.ok) throw new Error(body.error ?? 'Unable to save template.')
            router.push(`/templates/${body.data.id}`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to save template.')
        } finally { setLoading(false) }
    }, [authFetch, code, desc, forkedParent, language, router, stdin, tags, title])

    if (!session.isAuthenticated) {
        return <Dialog open={open} onOpenChange={(nextOpen) => !loading && setOpen(nextOpen)}>
            <DialogTrigger asChild onClick={preserveDraftForSignUp}>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save your work as a template</DialogTitle>
                    <DialogDescription>Your code will be kept while you sign in or create a free account, then you can finish saving it.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button asChild variant="outline">
                        <Link href="/users/login?returnTo=%2Fplayground%3FsaveTemplate%3D1">Log in</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/users/register?returnTo=%2Fplayground%3FsaveTemplate%3D1">Sign up</Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    }

    return <Dialog open={open} onOpenChange={(nextOpen) => !loading && setOpen(nextOpen)}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{forkedParent?.title ? 'Save forked template' : 'Save as template'}</DialogTitle>
                <DialogDescription>{forkedParent?.title ? `This template will be saved as a fork of “${forkedParent.title}”.` : 'Give your template a title, explanation, and tags so you can find and reuse it later.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="tpl-title">Title</Label>
                    <Input id="tpl-title" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Binary search, annotated" />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="tpl-exp">Description</Label>
                    <Textarea id="tpl-exp" value={desc} onChange={(event) => setDesc(event.target.value)} placeholder="What does this template do?" className="h-24 resize-none" />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="tpl-tags">Tags</Label>
                    <Input id="tpl-tags" value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} onKeyDown={addTag} placeholder="Type a tag and press Enter" />
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                                <button key={tag} type="button" onClick={() => removeTag(tag)}>
                                    <TagBadge label={tag} deleteMode />
                                </button>
                            ))}
                        </div>
                    )}
                    <p className="font-mono text-xs text-muted-foreground">Language: {language}</p>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || !title.trim()}>
                        {loading ? 'Creating…' : 'Create Template'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
}