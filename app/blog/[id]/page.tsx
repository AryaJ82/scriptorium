'use client'

import { useParams, useRouter } from "next/navigation";
import { toast } from 'sonner';
import { useUserSession } from '@/contexts/UserSessionContext';
import { useCallback, useState } from 'react';
import { BlogResponse, CommentResponse } from '@/utils/interfaces';
import BlogHeader from '@/components/BlogHeader';
import { VoteButtons } from "@/components/ui/VoteButtons";
import BlogContent from "@/components/BlogContent";
import BlogCommentSection from "@/components/BlogCommentSection";
import NotFound from "@/components/NotFound";
import { useApiGet } from '@/lib/useApiGet';

export default function BlogPostPage() {
  const params = useParams();
  const id = params?.id;
  const { session, baseUrl, authFetch } = useUserSession();

  const router = useRouter();

  const url = id ? `${baseUrl}/api/blogs/${id}` : null;
  const { data: post, loading, setData: setPost } = useApiGet<{ data?: BlogResponse | null; error?: string | null }, BlogResponse | null>(url, {
    transform: (raw) => raw.data ?? null,
    notOkMessage: 'Unable to load post',
    onSuccess: () => {},
    onError: (message) => toast.error(message),
  });

  const [mutating, setMutating] = useState(false);
  const isOwner = !!session && post?.authorId === session.id;
  const isBusy = loading || mutating;

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
    setMutating(true);

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

      setPost(body.data);
    }).catch((error) => {
      handleActionError(error instanceof Error ? error.message : 'Unable to update blog post.');
      return
    }).finally(() => {
        setMutating(false);
    })
  }, [id, authFetch, session, post, handleActionError, setPost]);

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

  if (!isBusy && !post) {
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
