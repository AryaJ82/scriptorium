'use client'

import { useUserSession } from "@/contexts/UserSessionContext"
import { BlogResponse, CommentResponse } from "@/utils/interfaces"
import { useState, useEffect, useCallback } from "react"
import { Label } from "./Label";
import Input from "./ui/Input";
import { Button } from "./ui/Button";
import CommentCard from "./CommentCard";
import { ChevronDownIcon } from "lucide-react";

const pageSize = 10;
export default function BlogCommentSection({
    blog,
}: {
    blog: BlogResponse;
}) {
    const { session, authFetch, baseUrl } = useUserSession();
    const [replies, setReplies] = useState<CommentResponse[]>([]);
    const [totalReplies, setTotalReplies] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [replyDraft, setReplyDraft] = useState<string>('');


    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const hasMoreReplies = totalReplies > replies.length;

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
                setReplies(body.comments);
                setTotalReplies(body.pagination.totalSize);
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


    const handleFetchReplies = useCallback(() => {
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
                setReplies(prev => [...prev, ...body.comments]);
                setPage(p => p + 1);
                setTotalReplies(body.pagination.totalSize);
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

            setReplies([body.comment, ...replies]);
            setReplyDraft('');
        }).catch((error) => {
            setError(error instanceof Error ? error.message : 'Unable to make commentpost.');
        });

    }, [blog, replies, session, authFetch]);

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
            {replies.length > 0 && (
                <div className="mt-3 flex flex-col gap-3">
                    {replies.map((reply, index) => (
                        <CommentCard
                            key={reply.id}
                            comment={reply}
                            ancestors={0}
                            updateComment={(updated: CommentResponse) => {
                                setReplies(prev =>
                                    prev.map((r, i) => (i === index ? updated : r))
                                );
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Loading indicator */}
            {loading && (
                <p className="mt-2 pl-1 text-xs text-muted-foreground animate-pulse">
                    Loading replies…
                </p>
            )}

            {/* Fetch more replies */}
            {hasMoreReplies && !loading && (
                <div className="flex justify-center">
                <Button
                    onClick={handleFetchReplies}
                    variant="destructive"
                    size="lg"
                    
                >
                    <ChevronDownIcon className="size-4" />
                    See {totalReplies - replies.length} more{' '}
                    {totalReplies - replies.length === 1 ? 'reply' : 'replies'}…
                    <ChevronDownIcon className="size-4" />
                </Button>
                </div>
            )}

        </div>
    );
}