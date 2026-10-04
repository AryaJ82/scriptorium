'use client'

import { useUserSession } from "@/contexts/UserSessionContext"
import { BlogResponse, CommentResponse } from "@/utils/interfaces"
import { useState, useCallback } from "react"
import { useCommentList } from "@/lib/useCommentList"

import { Button } from "./ui/Button";
import Textarea from "./ui/Textarea";
import CommentCard from "./CommentCard";
import { ChevronDown, MessageSquare, SendHorizonal } from "lucide-react";

const pageSize = 10;

export default function BlogCommentSection({
    blog,
}: {
    blog: BlogResponse;
}) {
    const { session, authFetch } = useUserSession();
    const {
        comments,
        total: totalComments,
        loading,
        error: fetchError,
        hasMore: hasMoreComments,
        loadMore: handleFetchMore,
        prepend,
        replace,
    } = useCommentList({ blogId: blog.id, pageSize });
    const [replyDraft, setReplyDraft] = useState<string>('');
    const [replySubmitting, setReplySubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const displayedError = error ?? fetchError;

    const handleReply = useCallback(() => {

        if (!session.isAuthenticated) {
            setError('You must be signed in to comment.');
            return;
        }

        if (!replyDraft.trim()) {
            setError('Comment cannot be empty.');
            return;
        }

        setError(null);
        setReplySubmitting(true);

        authFetch(`/api/blogs/${blog.id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content: replyDraft })
        }).then(async (response) => {
            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to post comment.');
            }
            prepend(body.data);
            setReplyDraft('');
        }).catch((err) => {
            setError(err instanceof Error ? err.message : 'Unable to post comment.');
        }).finally(() => {
            setReplySubmitting(false);
        });
    }, [blog.id, replyDraft, session, authFetch, prepend]);

    return (
        <section className="mt-8 flex flex-col gap-6">

            {/* ── Section heading ── */}
            <div className="flex items-center gap-2 border-t border-border pt-6">
                <MessageSquare className="size-4 text-muted-foreground" />
                <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {totalComments > 0 ? `${totalComments} Comments` : 'Comments'}
                </h2>
            </div>

            {/* ── Compose box ── */}
            {session.isAuthenticated ? (
                <div className="flex flex-col gap-2">
                    <Textarea
                        id="comment-draft"
                        placeholder="Join in on the discussion…"
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        rows={3}
                        className="resize-none text-sm"
                    />
                    <div className="flex items-center justify-between gap-2">
{displayedError && (
                            <p className="text-xs text-destructive">{displayedError}</p>
                        )}
                        <Button
                            onClick={handleReply}
                            disabled={replySubmitting || !replyDraft.trim()}
                            size="sm"
                            className="ml-auto flex items-center gap-1.5 text-xs"
                        >
                            <SendHorizonal className="size-3.5" />
                            {replySubmitting ? 'Posting…' : 'Post Comment'}
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Sign in to leave a comment.
                </p>
            )}

            {/* ── Comment list ── */}
            {comments.length > 0 && (
                <div className="flex flex-col gap-3">
                    {comments.map((comment) => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            ancestors={0}
                            updateComment={(updated: CommentResponse) => {
                                replace(comments.map((c) => (c.id === updated.id ? updated : c)));
                            }}
                        />
                    ))}
                </div>
            )}

            {!loading && !error && comments.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                    No comments yet. Be the first!
                </p>
            )}

            {/* Loading indicator */}
            {loading && (
                <p className="pl-1 text-xs text-muted-foreground animate-pulse">
                    Loading comments…
                </p>
            )}

            {/* Error state */}
            {error && !replySubmitting && (
                <p className="text-xs text-destructive">{error}</p>
            )}

            {hasMoreComments && !loading && (
                <div className="flex justify-center">
                    <Button
                        onClick={handleFetchMore}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                        <ChevronDown className="size-3.5" />
                        Load {Math.min(pageSize, totalComments - comments.length)} more comment{Math.min(pageSize, totalComments - comments.length) === 1 ? '' : 's'}
                    </Button>
                </div>
            )}
        </section>
    );
}
