'use client'

import Link from 'next/link';
import { toast } from 'sonner'
import { useUserSession } from '@/contexts/UserSessionContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/Dialog';
import { Button } from './ui/Button';
import { useCallback, useState } from 'react';
import { Label } from './Label';
import Textarea from './ui/Textarea';
import Input from './ui/Input';
import { useRouter } from 'next/navigation';
import { validateTagValue } from '@/utils/inputValidation/generalValidation';
import { TagBadge } from './TagBadge';

interface SaveBlogDialogueParams {
    children: React.ReactNode;
    initialTitle?: string;
    initialContent?: string;
    linkedTemplateId?: string;
}

export function SaveBlogDialogue({
    children,
    initialTitle = '',
    initialContent = '',
    linkedTemplateId
}: SaveBlogDialogueParams) {
    const { session, authFetch } = useUserSession();
    const [open, setOpen] = useState(false);

    const [title, setTitle] = useState<string>(initialTitle);
    const [content, setContent] = useState<string>(initialContent);
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

    const handleSaveBlog = useCallback(async (title: string, content?: string, tags?: string[], linkedTemplateId?: string) => {
        setLoading(true);

        authFetch("/api/blogs", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                content,
                tags,
                linked_template_id: linkedTemplateId,
            }),
        }).then(async (response) => {
            if (!response) {
                throw Error("An error has occured when creating blog post")
            }

            const body = await response.json()
            if (!response.ok) {
                throw Error(body.error ?? "An error has occured when creating blog post");
            }

            router.push(`/blog/${body.id}`);
            setOpen(false);
        }).catch((err) => {
            toast.error(err instanceof Error ? err.message : "Unable to create blog post.");
        }).finally(() => {
            setLoading(false);
        });

    }, [authFetch]);

    if (!session.isAuthenticated) {
        return (
            <Dialog>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a blog post</DialogTitle>
                        <DialogDescription>
                            Creating posts is available to members. Create a free account to share your thoughts.
                        </DialogDescription>

                        <DialogHeader>
                            <DialogFooter>
                                <Button asChild variant="outline">
                                    <Link href="/users/login">Log in</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/users/register">Sign up</Link>
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
                    <DialogTitle>Create blog post</DialogTitle>
                    <DialogDescription>
                        Give your post a title, some content, and optional tags so others can find it.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="blog-title">Title</Label>
                        <Input id="blog-title" placeholder="e.g. Why binary search matters" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="blog-content">Content</Label>
                        <Textarea
                            id="blog-content"
                            placeholder="Write something interesting..."
                            className="h-48 resize-none"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="blog-tags">Tags</Label>
                        <Input
                            id="blog-tags"
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
                                        className="mt-auto flex flex-wrap items-center gap-1.5 pt-1"
                                    >
                                        <TagBadge key={t} label={t} deleteMode={true} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={loading}
                        onClick={async () => {
                            handleSaveBlog(title, content, tags);
                        }}
                    >
                        Create Post
                    </Button>

                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

