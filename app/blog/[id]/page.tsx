'use client'

import { useParams, useRouter } from "next/navigation";
import { toast } from 'sonner';
import { useUserSession } from '@/contexts/UserSessionContext';
import { useCallback, useEffect, useState } from 'react';
import { BlogResponse, CommentResponse } from '@/utils/interfaces';
import BlogHeader from '@/components/BlogHeader';
import { VoteButtons } from "@/components/ui/VoteButtons";
import BlogContent from "@/components/BlogContent";
import BlogCommentSection from "@/components/BlogCommentSection";
import NotFound from "@/components/NotFound";

export default function BlogPostPage() {
  const params = useParams();
  const id = params?.id;
  const { session, baseUrl, authFetch } = useUserSession();

  const [post, setPost] = useState<BlogResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const isOwner = !!session && post?.authorId === session.id;



  useEffect(() => {
    if (!id) return;

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
        toast.error(err instanceof Error ? err.message : 'Unable to load post');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => { controller.abort() };
  }, [id, baseUrl])


  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const handleActionError = useCallback((error: string) => {
    toast.error(error ?? 'An error occurred while performing the action.');
  }, []);


  const updatePost = useCallback(async (updatePayload: { title?: string, content?: string, tags?: string[] }) => {
    if (!post || !session.isAuthenticated || post.authorId !== session?.id) {
      throw new Error("Invalid post or session")
    }
    setLoading(true);

    authFetch(`/api/blogs/${id}`, {
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
      handleActionError(error instanceof Error ? error.message : 'Unable to update blog post.');
      return
    }).finally(() => {
      setLoading(false);
    })
  }, [id, authFetch, session, post, handleActionError]);

  const deletePost = useCallback(async () => {
    if (!post || !session.isAuthenticated || post.authorId !== session?.id) {
      throw new Error("Invalid post or session")
    }

    authFetch(`${baseUrl}/api/blogs/${post.id}`, {
      method: 'DELETE',
    }).then(async (response) => {

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to delete blog post.');
      }

      router.push(`/blog`);

    }).catch((err) => {
      handleActionError(err instanceof Error ? err.message : 'Unable to delete blog post.');
    });
  }, [authFetch, baseUrl, post, session, router, handleActionError]);


  if (!loading && !post) {
    return <NotFound resource="blog post" title="Blog post not found" description="That blog post does not exist or is no longer available." />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <article className="flex flex-col gap-0">

        {/* ── Header ── */}
        {post && (<BlogHeader
          post={post}
          onSaveTitle={(title) => updatePost({ title })}
          onSaveTags={(tags) => updatePost({ tags })}
          onDelete={deletePost}
          isOwner={isOwner}
          setPost={setPost}
          handleActionError={handleActionError}
        />)}

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
            postType="blog"
            orientation="horizontal"
            updatePost={setPost as ((p: BlogResponse | CommentResponse) => void)}
            handleActionError={handleActionError}
          />
        </div>}
      </article>

      {post && <BlogCommentSection
        blog={post}
      />}
    </div>
  );
}
