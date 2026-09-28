'use client'

import { useUserSession } from "@/contexts/UserSessionContext"
import { BlogResponse, CommentResponse } from "@/utils/interfaces"
import { useState, useEffect, useCallback } from "react"
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
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [totalComments, setTotalComments] = useState<number>(0);
    const [page, setPage] = useState<number>(2); // initial load fetches page 1; next fetch starts at 2
    const [replyDraft, setReplyDraft] = useState<string>('');
    const [replySubmitting, setReplySubmitting] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const hasMoreComments = totalComments > comments.length;

    useEffect(() => {
        const queryParams = new URLSearchParams();
        queryParams.append('blog_id', blog.id.toString());
        queryParams.append('page', '1');
        queryParams.append('pageSize', pageSize.toString());
        queryParams.append('sortBy', 'upvoteCount');
        queryParams.append('orderBy', 'desc');

        const controller = new AbortController();
        fetch(`/api/comments/?${queryParams.toString()}`, {
            method: "GET",
            signal: controller.signal
        })
            .then(async (res) => {
                const body = await res.json();
                if (!res.ok) throw new Error(body.error ?? 'Failed to fetch comments');
                setComments(body.data ?? []);
                setTotalComments(body.pagination?.totalSize ?? 0);
                setPage(p => p + 1);
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                setError(err instanceof Error ? err.message : 'Failed to load comments.');
            })
            .finally(() => {
                setLoading(false);
            });

        return () => controller.abort();
    }, [blog.id]);

    const handleFetchMore = useCallback(() => {
        const queryParams = new URLSearchParams();
        queryParams.append('blog_id', blog.id.toString());
        queryParams.append('page', page.toString());
        queryParams.append('pageSize', pageSize.toString());
        queryParams.append('sortBy', 'upvoteCount');
        queryParams.append('orderBy', 'desc');

        setLoading(true);
        setError(null);

        const controller = new AbortController();
        fetch(`/api/comments/?${queryParams.toString()}`, {
            method: "GET",
            signal: controller.signal
        })
            .then(async (res) => {
                const body = await res.json();
                if (!res.ok) throw new Error(body.error ?? 'Failed to fetch comments');
                setComments(prev => [...prev, ...(body.data ?? [])]);
                setPage(p => p + 1);
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setError(err instanceof Error ? err.message : 'Failed to fetch more comments.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [blog.id, page]);

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
            setComments(prev => [body.data, ...prev]);
            setTotalComments(prev => prev + 1);
            setReplyDraft('');
        }).catch((err) => {
            setError(err instanceof Error ? err.message : 'Unable to post comment.');
        }).finally(() => {
            setReplySubmitting(false);
        });
    }, [blog.id, replyDraft, session, authFetch]);

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
                        {error && (
                            <p className="text-xs text-destructive">{error}</p>
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
                    {comments.map((comment, index) => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            ancestors={0}
                            updateComment={(updated: CommentResponse) => {
                                setComments(prev =>
                                    prev.map((c, i) => (i === index ? updated : c))
                                );
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