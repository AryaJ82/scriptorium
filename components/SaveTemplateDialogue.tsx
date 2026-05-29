'use client'

import { X } from 'lucide-react'
import Link from 'next/link';
import { toast } from 'sonner'
import { useUserSession } from '@/contexts/UserSessionContext';
import { Language } from '@/utils/interfaces';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/Dialog';
import { Button } from './ui/Button';
import { useState } from 'react';
import { Label } from './Label';
import Textarea from './ui/Textarea';
import Input from './ui/Input';

interface SaveTemplateDialogueParams {
    children: React.ReactNode
    language: Language
    forkedFromTitle?: string
}
export function SaveTemplateDialogue({
    children,
    language,
    forkedFromTitle,
}: SaveTemplateDialogueParams) {
    const { session } = useUserSession();
    const [open, setOpen] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [tagDraft, setTagDraft] = useState('');

    function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
        if ((e.key === 'Enter' || e.key === ',') && tagDraft.trim()) {
            e.preventDefault();
            const t = tagDraft.trim().replace(/^#/, '');
            if (!tags.includes(t)) setTags([...tags, t]);
            setTagDraft('');
        }
    }

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
            {forkedFromTitle ? 'Save forked template' : 'Save as template'}
          </DialogTitle>
          <DialogDescription>
            {forkedFromTitle
              ? `This will be saved as a fork of “${forkedFromTitle}”.`
              : 'Give your template a title, explanation, and tags so you can find and reuse it later.'}
          </DialogDescription>
        </DialogHeader>


        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tpl-title">Title</Label>
            <Input id="tpl-title" placeholder="e.g. Binary search, annotated" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tpl-exp">Description</Label>
            <Textarea
              id="tpl-exp"
              placeholder="What does this template do? When would you reach for it?"
              className="h-24 resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tpl-tags">Tags</Label>
            <Input
              id="tpl-tags"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={addTag}
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
            onClick={() => {
              setOpen(false)
              toast.success(
                forkedFromTitle
                  ? 'Forked template saved (mock)'
                  : 'Template saved (mock)',
                { description: 'Wired to the API during Stage 2.' },
              )
            }}
          >
            Save template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
