'use client'

import { X } from 'lucide-react'
import Link from 'next/link';
import { Toaster, toast } from 'sonner'
import { useUserSession } from '@/contexts/UserSessionContext';
import { Language } from '@/utils/interfaces';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/Dialog';
import { Button } from './ui/Button';
import { useCallback, useState } from 'react';
import { Label } from './Label';
import Textarea from './ui/Textarea';
import Input from './ui/Input';
import { useRouter } from 'next/navigation';
import { validateTagValue } from '@/utils/inputValidation/generalValidation';

interface SaveTemplateDialogueParams {
    children: React.ReactNode;
    language: Language;
    code?: string;
    stdin?: string;
    forkedParent?: { title: string, id: string };
}
export function SaveTemplateDialogue({
    children,
    language,
    code,
    stdin,
    forkedParent,
}: SaveTemplateDialogueParams) {
    const { session, authFetch } = useUserSession();
    const [open, setOpen] = useState(false);

    const [title, setTitle] = useState<string>("");
    const [desc, setDesc] = useState<string>("");
    const [tagDraft, setTagDraft] = useState<string>('');
    const [tags, setTags] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const addTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>, tagDraft: string) => {
        if ((e.key === 'Enter' || e.key === ',' || e.key === "#" || e.key === ' ' || e.key === '&' || e.key === '$') && tagDraft.trim()) {
            e.preventDefault();
            const newTag = tagDraft.trim().toLowerCase();
            const error = validateTagValue(newTag);
            if (error) {
                toast.error(error.message);
                return;
            }

            if (!tags.includes(newTag)) setTags([...tags, newTag]);
            setTagDraft('');
        }
    }, [tagDraft, tags]);

    const handleSaveTemplate = useCallback(async (title: string, code?: string, desc?: string, stdin?: string, tags?: string[]) => {
        const response = await authFetch("/api/templates", {
            method: "POST",
            body: JSON.stringify({
                title,
                code,
                description: desc,
                stdin,
                language,
                tags,
                ...(forkedParent && {
                    forkedSourceId: forkedParent.id,
                }),
            }),
        });

        if (!response) {
            return Response.json({ error: "An unknown error occurred" }, { status: 600 }); // TODO: need to set error back to normal. Timeout?
        } else if (response.ok) {
            return response;
        } else {
            return response;
        }

    }, [authFetch, language, forkedParent]);

    if (!session.isAuthenticated) {
        return (
            <Dialog>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save your work as a template</DialogTitle>
                        <DialogDescription>
                            Saving templates is available to members. Create a free account to
                            organize and share your code.
                        </DialogDescription>

                        <DialogHeader>
                            <DialogFooter>
                                <Button asChild variant="outline">
                                    <Link href="users/login">Log in</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="users/register">Sign up</Link>
                                </Button>
                            </DialogFooter>
                        </DialogHeader>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {forkedParent?.title ? 'Save forked template' : 'Save as template'}
                    </DialogTitle>
                    <DialogDescription>
                        {forkedParent?.title
                            ? `This template will be saved as a fork of “${forkedParent?.title}”.`
                            : 'Give your template a title, explanation, and tags so you can find and reuse it later.'}
                    </DialogDescription>
                </DialogHeader>


                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="tpl-title">Title</Label>
                        <Input id="tpl-title" placeholder="e.g. Binary search, annotated" onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="tpl-exp">Description</Label>
                        <Textarea
                            id="tpl-exp"
                            placeholder="What does this template do? When would you reach for it?"
                            className="h-24 resize-none"
                            onChange={(e) => setDesc(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="tpl-tags">Tags</Label>
                        <Input
                            id="tpl-tags"
                            value={tagDraft}
                            onChange={(e) => setTagDraft(e.target.value)}
                            onKeyDown={(e) => addTag(e, tagDraft)}
                            placeholder="Type a tag and press Enter"
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {tags.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setTags(tags.filter((x) => x !== t))}
                                        className="group"
                                    >
                                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 font-mono text-xs">
                                            #{t}
                                            <X className="size-3 text-muted-foreground group-hover:text-destructive" />
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="font-mono text-xs text-muted-foreground">
                            Language:{' '}
                            {language}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={async () => {
                            setLoading(true);
                            const response = await handleSaveTemplate(title, code, desc, stdin, tags);
                            const body = await response.json();
                            if (response.ok && body.id) {

                                setOpen(false);
                                setLoading(false);
                                router.push(`/templates/${body.id}`);
                            } else {
                                setLoading(false);
                                toast.error(
                                    body.error,
                                );
                            }
                        }}
                    >
                        Create Template
                    </Button>


                    <Toaster richColors />

                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
