'use client'

import Link from 'next/link';
import { toast } from 'sonner'
import { useUserSession } from '@/contexts/UserSessionContext';
import { Language } from '@/utils/interfaces';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/Dialog';
import { Button } from './ui/Button';
import { useCallback, useState } from 'react';
import { Label } from './Label';
import Textarea from './ui/Textarea';
import Input from './ui/Input';
import { useRouter } from 'next/navigation';
import { TagBadge } from './TagBadge';
import { useTagEdit } from '@/lib/useTagEdit';


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
    const { tagDraft, setTagDraft, tags, addTag, removeTag } = useTagEdit();

    const [loading, setLoading] = useState(false);
    const router = useRouter();


    const handleSaveTemplate = useCallback(async (title: string, code?: string, desc?: string, stdin?: string, tags?: string[]) => {
        setLoading(true);

        authFetch("/api/templates", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
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
        }).then(async (response) => {
            if (!response) {
                throw Error("An error has occured when creating template")
            }

            const body = await response.json()
            if (!response.ok) {
                throw Error(body.error ?? "An error has occured when creating template");
            }

            router.push(`/templates/${body.data.id}`);
        }).catch((err) => {
            toast.error(err instanceof Error ? err.message : "Unable to save template.");
        }).finally(() => {
            setLoading(false);
        });

    }, [authFetch, language, forkedParent, router]);

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
                            onKeyDown={(e) => addTag(e)}
                            placeholder="Type a tag and press Enter"
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {tags.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => removeTag(t)}
                                        className="mt-auto flex flex-wrap items-center gap-1.5 pt-1"
                                    >
                                        <TagBadge key={t} label={t} deleteMode={true} />
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
                            handleSaveTemplate(title, code, desc, stdin, tags);
                        }}
                    >
                        Create Template
                    </Button>

                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
