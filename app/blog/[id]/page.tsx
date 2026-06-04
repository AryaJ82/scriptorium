'use client'

import { useParams } from 'next/navigation'
import { useUserSession } from '@/contexts/UserSessionContext'
import { useEffect, useState } from 'react'
import { BlogResponse } from '@/utils/interfaces'
import { VoteButtons } from '@/components/ui/VoteButtons'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar'
import { formatDistanceToNow } from 'date-fns'

import { timeAgo } from '@/utils/timeAgo'

export default function BlogPostPage() {
  const params = useParams();
  const id = params?.id;
  const { baseUrl } = useUserSession();

  const [post, setPost] = useState<BlogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    setActionError(null);

    fetch(`${baseUrl}/api/blogs/${id}`, {
      signal: controller.signal
    }).then(async (res) => {
      const body = await res.json();
      if (controller.signal.aborted) return;

      if (!res.ok) throw new Error(body.error ?? 'Unable to load post')

      const p: BlogResponse | undefined = body.post;
      if (!p) throw new Error('Post not found');
      setPost(p)
    })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setActionError(err instanceof Error ? err.message : 'Unable to load post');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => { controller.abort() };
  }, [id, baseUrl])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 w-72 rounded-md bg-muted mb-2" />
          <div className="h-4 w-48 rounded-md bg-muted" />
        </div>
      ) : actionError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{actionError}</p>
        </div>
      ) : post ? (
        <article className="flex flex-col gap-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  {post.author.avatarUrl ? (
                    <AvatarImage src={post.author.avatarUrl} alt={post.author.username} />
                  ) : (
                    <AvatarFallback>@{post.author.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h1 className="font-serif text-2xl font-semibold tracking-tight">{post.title}</h1>
                  <p className="text-xs text-muted-foreground">By <span className="font-mono">@{post.author.username}</span> • {timeAgo(post.createdAt as unknown as string)}</p>
                </div>
              </div>
            </div>

            <div className="hidden sm:block">
              <VoteButtons upvotes={post.upvoteCount} downvotes={post.downvoteCount} orientation="vertical" />
            </div>
          </header>

          <div className="prose max-w-none">{post.content}</div>

        </article>
      ) : null}
    </div>
  )
}
