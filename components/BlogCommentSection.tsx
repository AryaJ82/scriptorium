'use client'

import { useUserSession } from "@/contexts/UserSessionContext"
import { BlogResponse, CommentResponse } from "@/utils/interfaces"
import { useState, useEffect, useCallback } from "react"
import { Label } from "./Label";
import Input from "./ui/Input";
import { Button } from "./ui/Button";
import CommentCard from "./CommentCard";

const pageSize = 10;
export default function BlogCommentSection({
    blog,
}: {
    blog: BlogResponse;
}) {
    const { session, authFetch, baseUrl } = useUserSession();
    const [replies, setReplies] = useState<CommentResponse[]>([])
    const [page, setPage] = useState<number>(1);
    const [replyDraft, setReplyDraft] = useState<string>('')


    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
            });

        return () => controller.abort();

    }, [baseUrl, blog])

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

            setReplies([...replies, body.comment]);
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

        </div>
    );
}