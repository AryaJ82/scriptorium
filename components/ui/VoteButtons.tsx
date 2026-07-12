'use client'

import { useUserSession } from '@/contexts/UserSessionContext';
import { useCallback} from 'react';
import { ArrowBigDown, ArrowBigUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlogResponse, CommentResponse } from '@/utils/interfaces';;

const formatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  compactDisplay: 'short',
});

export function VoteButtons({
  post,
  orientation = 'vertical',
  className,
  postType = 'blog',
  updatePost,
  handleActionError,
}: {
  post: BlogResponse| CommentResponse;
  orientation?: 'vertical' | 'horizontal';
  postType?: 'blog' | 'comment';
  className?: string;
  updatePost: (newObject: BlogResponse | CommentResponse) => void;
  handleActionError: (err: string) => void;
}) {
  const { session, baseUrl, authFetch } = useUserSession();


  const score = formatter.format(post.upvoteCount - post.downvoteCount);
  const hasUpvoted = post.upvotingUsers?.length > 0;
  const hasDownvoted = post.downvotingUsers?.length > 0;


  const handleUpvote = useCallback(async () => {
    if (!post || !session.isAuthenticated) {
      throw new Error("Invalid post or session")
    }

    authFetch(`${baseUrl}/api/${postType}s/${post.id}/upvote`, {
      method: 'PATCH',
    }).then(async (response) => {

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to upvote blog post.');
      }

      updatePost(body[postType]);

    }).catch((error) => {
      if (handleActionError) handleActionError(error instanceof Error ? error.message : 'Unable to upvote blog post.');
    });
  }, [authFetch, baseUrl, post, postType, updatePost, session, handleActionError]);

  const handleDownvote = useCallback(async () => {
    if (!post || !session.isAuthenticated) {
      throw new Error("Invalid post or session")
    }

    authFetch(`${baseUrl}/api/${postType}s/${post.id}/downvote`, {
      method: 'PATCH',
    }).then(async (response) => {

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to downvote blog post.');
      }

      updatePost(body[postType]);

    }).catch((error) => {
      if (handleActionError) handleActionError(error instanceof Error ? error.message : 'Unable to downvote blog post.');
    });
  }, [authFetch, baseUrl, post, postType, updatePost, session, handleActionError]);


  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-card',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Upvote"
        onClick={handleUpvote}
        className={cn(
          'flex items-center justify-center rounded-md p-1.5 transition-colors hover:text-primary',
          hasUpvoted ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        <ArrowBigUp className="size-4" />
      </button>
      <span
        className={cn(
          'min-w-8 text-center font-mono text-sm tabular-nums',
        )}
      >
        {score}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        onClick={handleDownvote}
        className={cn(
          'flex items-center justify-center rounded-md p-1.5 transition-colors hover:text-destructive',
          hasDownvoted ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        <ArrowBigDown className="size-4" />
      </button>
    </div>
  )
}
