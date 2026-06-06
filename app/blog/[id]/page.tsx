'use client'

import { useParams, useRouter } from "next/navigation";
import { useUserSession } from '@/contexts/UserSessionContext'
import { useCallback, useEffect, useState } from 'react'
import { BlogResponse, CommentResponse } from '@/utils/interfaces'
import ReactMarkdown from "react-markdown";
import BlogHeader from '@/components/BlogHeader'
import { VoteButtons } from "@/components/ui/VoteButtons";
import BlogContent from "@/components/BlogContent";
import Input from "@/components/ui/Input";
import { Label } from "@/components/Label";
import BlogCommentSection from "@/components/BlogCommentSection";

export default function BlogPostPage() {
  const params = useParams();
  const id = params?.id;
  const { session, baseUrl, authFetch } = useUserSession();

  const [post, setPost] = useState<BlogResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

  const isOwner = !!session && post?.authorId === session.id;



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

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------


  const updatePost = useCallback(async (updatePayload: { title?: string, content?: string, tags?: string[] }) => {
    if (!post || !session.isAuthenticated || post.authorId !== session?.id) {
      throw new Error("Invalid post or session")
    }
    setActionError(null);
    setLoading(true);

    authFetch(`${baseUrl}/api/blogs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updatePayload
      }),
    }).then(async (response) => {

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to update blog post.');
      }

      setPost(body.post);
    }).catch((error) => {
      setActionError(error instanceof Error ? error.message : 'Unable to save blog post changes.');
      return
    }).finally(() => {
      setLoading(false);
    })
  }, [id, authFetch, baseUrl, session, post]);

  const deletePost = useCallback(async () => {
    if (!post || !session.isAuthenticated || post.authorId !== session?.id) {
      throw new Error("Invalid post or session")
    }
    setActionError(null);

    authFetch(`${baseUrl}/api/blogs/${post.id}`, {
      method: 'DELETE',
    }).then(async (response) => {

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to delete blog post.');
      }

      router.push(`/blog`);

    }).catch((error) => {
      setActionError(error instanceof Error ? error.message : 'Unable to delete blog post.');
    });
  }, [authFetch, baseUrl, post, session]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <article className="flex flex-col gap-0">

        {/* ── Header ── */}
        {post ? (<BlogHeader
          post={post}
          onSaveTitle={(title) => updatePost({ title })}
          onSaveTags={(tags) => updatePost({ tags })}
          onDelete={deletePost}
          isOwner={isOwner}
          setPost={setPost}
          setActionError={setActionError}
        />
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
            <BlogContent
              post={post}
              isOwner={isOwner}
              onSave={(newContent: string) => updatePost({ content: newContent })}
            />
          </div>
        )}
        {post && <div className="hidden shrink-0 sm:block">
          <VoteButtons
            post={post}
            type="blog"
            orientation="horizontal"
            updatePost={setPost as ((p: BlogResponse | CommentResponse) => void)}
            setActionError={setActionError}
          />
        </div>}
      </article>

      {post && <BlogCommentSection
        blog={post}
      />}
    </div>
  );
}
