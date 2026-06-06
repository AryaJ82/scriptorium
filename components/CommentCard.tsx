'use client'

import { useUserSession } from "@/contexts/UserSessionContext";
import { CommentResponse, BlogResponse } from "@/utils/interfaces";
import { useCallback, useState } from "react";
import { VoteButtons } from "./ui/VoteButtons";
import { DisplayAvatar } from "./ui/Avatar";
import { timeAgo } from "@/utils/timeAgo";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Button } from "./ui/Button";
import { Menu, Trash, Edit, MessageCircle, X, SendHorizonal, Flag, Pencil, ArrowDownFromLine, MoveDownRight } from "lucide-react";
import Textarea from "./ui/Textarea";

const pageSize = 10;

export default function CommentCard({
    comment,
    updateComment,
    ancestors = 0,
}: {
    comment: CommentResponse;
    updateComment: (newComment: CommentResponse) => void;
    ancestors?: number;
}) {
    const { session, baseUrl, authFetch } = useUserSession();
    const [replies, setReplies] = useState<CommentResponse[]>([]);
    const [page, setPage] = useState<number>(1);

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [isReplyOpen, setIsReplyOpen] = useState<boolean>(false);
    const [replyDraft, setreplyDraft] = useState<string>('');
    const [replySubmitting, setReplySubmitting] = useState<boolean>(false);

    const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);


    const hasMoreReplies = comment.numReplies > replies.length;
    const isOwner = comment.authorId === session.id;

    const indentClass = ancestors > 0
        ? `pl-${Math.min(ancestors * 4, 16)} border-l border-border`
        : '';

    const handleFetchReplies = useCallback(() => {
        const queryParams = new URLSearchParams();
        queryParams.append('parent_comment_id', comment.id.toString());
        queryParams.append('page', page.toString());
        queryParams.append('pageSize', pageSize.toString());
        queryParams.append('sortBy', 'upvoteCount');
        queryParams.append('orderBy', 'desc');

        setLoading(true);
        setError(null);

        const controller = new AbortController();
        fetch(`/api/comments?${queryParams.toString()}`, {
            method: "GET",
            signal: controller.signal
        })
            .then(async (res) => {
                const body = await res.json();
                if (!res.ok) throw new Error(body.error ?? 'Failed to fetch replies');
                setReplies(prev => [...prev, ...body.comments]);

                setPage(p => p + 1);

                updateComment({
                    ...comment,
                    numReplies: body.pagination.totalSize,
                    author: { ...comment.author },
                });
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;
                setError(err instanceof Error ? err.message : 'Failed to fetch replies. Please try again later.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [comment.id, page]);

    const handleReply = useCallback(() => {
        if (!comment || !session.isAuthenticated) return;

        if (!replyDraft.trim()) {
            setError('Reply cannot be empty.');
            return;
        }

        setError(null);
        setReplySubmitting(true);

        authFetch(`${baseUrl}/api/blogs/${comment.blogPostId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: replyDraft,
                parent_comment_id: comment.id,
            }),
        }).then(async (response) => {
            const body = await response.json();
            if (!response.ok) {
                throw new Error(body.error ?? 'Unable to post reply.');
            }

            setReplies(prev => [...prev, ...body.comments]);

            updateComment({
                ...comment,
                numReplies: body.pagination.totalSize,
                author: { ...comment.author },
            });

            cancelReply();
        }).catch((error) => {
            setError(error instanceof Error ? error.message : 'Unable to post reply.');
        }).finally(() => {
            setReplySubmitting(false);
        });

    }, [comment, authFetch, replyDraft, replies, updateComment]);

    const cancelReply = useCallback(() => {
        setIsReplyOpen(false);
        setreplyDraft('');
        setError(null);
    }, []);

    const propagateUpdate = useCallback((newComment: CommentResponse) => {
        updateComment({
            ...comment,
            upvoteCount: newComment.upvoteCount,
            downvoteCount: newComment.downvoteCount,
            upvotingUsers: newComment.upvotingUsers,
            downvotingUsers: newComment.downvotingUsers,
            author: { ...comment.author },
        });
    }, [comment, replies, updateComment]);

    return (
        <div className={indentClass}>
            {/* ── Comment card ── */}
            <div className="rounded-lg border border-border bg-card px-4 py-3 flex flex-col gap-3">

                {/* Author row */}
                <div className="flex flex-row items-center justify-between gap-3">
                    <div className="flex flex-row items-center gap-1">
                        <DisplayAvatar user={comment.author} size="md" />
                        <div className="flex flex-col gap-0.5">
                            <div className="text-sm text-muted-foreground">
                                <span className="font-mono font-medium text-foreground">
                                    @{comment.author.username}
                                </span>
                                {comment.author.role && comment.author.role !== 'USER' && (
                                    <span className="ml-1.5 rounded-full border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                                        {comment.author.role}
                                    </span>
                                )}
                                <p>
                                {`Posted ${timeAgo(comment.createdAt as unknown as string)}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="flex items-center justify-center rounded-md border border-border p-2 outline-none hover:bg-accent"
                                aria-label="Template actions"
                            >
                                <Menu className="size-4" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            {!isOwner && (
                                <DropdownMenuItem
                                    variant="default"
                                    onClick={() => setIsReportOpen(true)}
                                    disabled={deleteLoading || isDeleteOpen}
                                >
                                    <Flag className="size-3" /> Report
                                </DropdownMenuItem>
                            )}
                            {isOwner && (
                                <DropdownMenuItem
                                    variant='default'
                                    onClick={() => setIsEditOpen(true)}
                                    disabled={deleteLoading || isDeleteOpen}
                                >
                                    <Pencil className="size-3" /> Edit
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {isOwner && (
                                <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setIsDeleteOpen(true)}
                                    disabled={deleteLoading || isDeleteOpen}
                                >
                                    <Trash className="size-3" /> Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Comment body */}
                <p className="text-sm leading-relaxed text-foreground">
                    {comment.content}
                </p>

                {/* Bottom action row: votes + reply button */}
                <div className="flex flex-row items-center justify-between gap-2">
                    <VoteButtons
                        post={comment}
                        type="comment"
                        orientation="horizontal"
                        updatePost={propagateUpdate as (p: BlogResponse | CommentResponse) => void}
                    />

                    {session.isAuthenticated && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsReplyOpen(o => !o)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <MessageCircle className="size-3.5" />
                            Reply
                        </Button>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <p className="text-xs text-destructive">{error}</p>
                )}
            </div>

            {/* ── Reply composer ── */}
            {isReplyOpen && (
                <div className="mt-2 pl-4 border-l-2 border-border flex flex-col gap-2">
                    <Textarea
                        value={replyDraft}
                        onChange={(e) => setreplyDraft(e.target.value)}
                        placeholder={`Replying to @${comment.author.username}…`}
                        rows={3}
                        className="resize-none text-sm"
                    />
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelReply}
                            disabled={replySubmitting}
                            className="flex items-center gap-1.5 text-xs"
                        >
                            <X className="size-3.5" />
                            Cancel
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReply}
                            disabled={replySubmitting || !replyDraft.trim()}
                            className="flex items-center gap-1.5 text-xs"
                        >
                            <SendHorizonal className="size-3.5" />
                            {replySubmitting ? 'Posting…' : 'Post Reply'}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Nested replies ── */}
            {replies.length > 0 && !loading && (
                <div className="mt-3 flex flex-col gap-3">
                    {replies.map((reply, index) => (
                        <CommentCard
                            key={reply.id}
                            comment={reply}
                            ancestors={ancestors + 1}
                            updateComment={(updated: CommentResponse) => {
                                setReplies(prev =>
                                    prev.map((r, i) => (i === index ? updated : r))
                                );
                                propagateUpdate(comment);
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
                <button
                    onClick={handleFetchReplies}
                    className="mt-2 flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground "
                >
                    <MoveDownRight className="size-4"/>
                    See {comment.numReplies - replies.length} more{' '}
                    {comment.numReplies - replies.length === 1 ? 'reply' : 'replies'}…
                </button>
            )}
        </div>
    );
}
