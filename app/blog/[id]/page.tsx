'use client'

import { useParams } from 'next/navigation'
import { useUserSession } from '@/contexts/UserSessionContext'
import { useEffect, useState } from 'react'
import { BlogResponse } from '@/utils/interfaces'
import ReactMarkdown from "react-markdown";
import BlogHeader from '@/components/BlogHeader'
import DescriptionSection from '@/components/TemplateDescription'

export default function BlogPostPage() {
  const params = useParams();
  const id = params?.id;
  const { baseUrl } = useUserSession();

  const [post, setPost] = useState<BlogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setActionError(null);

    const controller = new AbortController();
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
      <article className="flex flex-col gap-0">

        {/* ── Header ── */}
        {post ? (<BlogHeader post={post}></BlogHeader>
        ) : (
          <div className="mb-6 flex flex-col gap-2 animate-pulse">
            <div className="h-8 w-64 rounded-md bg-muted" />
            <div className="h-4 w-40 rounded-md bg-muted" />
          </div>
        )}

        {/* ── Divider ── */}
        <hr className="my-6 border-border/30" />


        {/* ── Body ── */}
        {!loading && post && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        )}



        {/* ── Footer ── */}
        {/* <div className="mt-6 flex items-center justify-between border-t border-border/30 pt-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBookmarked((b) => !b)}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark post"}
              className="flex items-center gap-1.5 rounded-lg border border-border/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <BookmarkIcon filled={bookmarked} size={14} />
              {bookmarked ? "Saved" : "Save"}
            </button>

            <button
              aria-label="Share post"
              className="flex items-center gap-1.5 rounded-lg border border-border/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <ShareIcon size={14} />
              Share
            </button>
          </div>

          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon size={12} />
            {readTime} min read
          </span>
        </div> */}

      </article>
    </div>
  );
}
