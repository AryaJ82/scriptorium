'use client'

import { useUserSession } from "@/contexts/UserSessionContext"
import { BlogResponse, CommentResponse } from "@/utils/interfaces"
import { useState, useEffect, useCallback } from "react"
import { Label } from "./Label";
import Input from "./ui/Input";
import { Button } from "./ui/Button";
import CommentCard from "./CommentCard";
import { ChevronDown } from "lucide-react";

const pageSize = 10;
export default function BlogCommentSection({
    blog,
}: {
    blog: BlogResponse;
}) {
    const { session, authFetch, baseUrl } = useUserSession();
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [totalComments, setTotalComments] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [replyDraft, setReplyDraft] = useState<string>('');


    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const hasMoreComments = totalComments > comments.length;

    useEffect(() => {
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
                if (!res.ok) throw new Error('Failed to fetch templates');
                const body = await res.json();
                setComments(body.comments);
                setTotalComments(body.pagination.totalSize);
                setPage(p => p + 1);
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
            })
            .finally(() => {
                setLoading(false);
            });

        return () => controller.abort();

    }, [baseUrl, blog.id])


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
                if (!res.ok) throw new Error(body.error ?? 'Failed to fetch replies');
                setComments(prev => [...prev, ...body.comments]);
                setPage(p => p + 1);
                setTotalComments(body.pagination.totalSize);
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setError(err instanceof Error ? err.message : 'Failed to fetch replies. Please try again later.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [baseUrl, blog, page])

    const handleReply = useCallback(async (reply: string) => {
        // Reply to blog post with comment
        if (!blog || !session.isAuthenticated) {
            throw new Error("Invalid post or session")
        }
        setError(null);

        return authFetch(`${baseUrl}/api/blogs/${blog.id}/comments`, {
            method: 'POST',
            body: JSON.stringify({
                content: reply
            })
        }).then(async (response) => {

            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to make comment post.');
            }

            setComments([body.comment, ...comments]);
            setReplyDraft('');
        }).catch((error) => {
            setError(error instanceof Error ? error.message : 'Unable to make commentpost.');
        });

    }, [blog, comments, session, authFetch]);

    return (
        <div>
            <div className="mt-6 flex items-center justify-between border-t border-border/30 pt-5">
                <div className="flex items-center gap-2">
                    <Input id="blog-title" placeholder="Join in on the dicussion" value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} />
                    <Button
                        onClick={() => handleReply(replyDraft)}>
                        Reply
                    </Button>
                </div>
            </div>
            {comments.length > 0 && (
                <div className="mt-3 flex flex-col gap-3">
                    {comments.map((reply, index) => (
                        <CommentCard
                            key={reply.id}
                            comment={reply}
                            ancestors={0}
                            updateComment={(updated: CommentResponse) => {
                                setComments(prev =>
                                    prev.map((r, i) => (i === index ? updated : r))
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

            {/* Fetch more replies */}
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

        </div>
    );
}