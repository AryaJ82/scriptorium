'use client'

import { useCallback, useMemo, useState } from 'react'
import { useApiGet } from '@/lib/useApiGet'
import type { CommentResponse } from '@/utils/interfaces'

type CommentListResponse = {
  data?: CommentResponse[]
  pagination?: { totalSize?: number }
  error?: string | null
}

type UseCommentListOptions = {
  blogId?: number
  parentCommentId?: number
  pageSize?: number
  initialLoad?: boolean
}

export function useCommentList({
  blogId,
  parentCommentId,
  pageSize = 10,
  initialLoad = true,
}: UseCommentListOptions) {
  const [page, setPage] = useState(1)
  const [started, setStarted] = useState(initialLoad)
  const [total, setTotal] = useState(0)

  const url = useMemo(() => {
    if (!started || (blogId === undefined && parentCommentId === undefined)) return null

    const params = new URLSearchParams()
    if (blogId !== undefined) params.set('blog_id', String(blogId))
    if (parentCommentId !== undefined) params.set('parent_comment_id', String(parentCommentId))
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    params.set('sortBy', 'upvoteCount')
    params.set('sortOrder', 'desc')
    return `/api/comments?${params.toString()}`
  }, [blogId, parentCommentId, page, pageSize, started])

  const { data: comments, loading, error, setData } = useApiGet<CommentListResponse, CommentResponse[]>(url, {
    transform: (body, previous) => {
      setTotal(body.pagination?.totalSize ?? 0)
      const next = body.data ?? []
      return page === 1 ? next : [...(previous ?? []), ...next]
    },
  })

  const loadMore = useCallback(() => {
    if (loading || (started && page > 1 && (comments?.length ?? 0) >= total)) return
    setStarted(true)
    if (started) setPage((current) => current + 1)
  }, [comments?.length, loading, page, started, total])

  const replace = useCallback((next: CommentResponse[]) => {
    setData(next)
    setTotal(next.length)
  }, [setData])

  const prepend = useCallback((comment: CommentResponse) => {
    setData((current) => [comment, ...(current ?? [])])
    setTotal((current) => current + 1)
  }, [setData])

  return {
    comments: comments ?? [],
    total,
    loading,
    error,
    hasMore: total > (comments?.length ?? 0),
    loadMore,
    replace,
    prepend,
  }
}
