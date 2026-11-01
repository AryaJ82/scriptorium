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

type CommentListState = {
  scopeKey: string
  page: number
  started: boolean
  total: number
  pages: Record<number, CommentResponse[]>
}

export function combineCommentPages(pages: Record<number, CommentResponse[]>) {
  return Object.keys(pages)
    .map(Number)
    .sort((left, right) => left - right)
    .flatMap((pageNumber) => pages[pageNumber])
}

export function useCommentList({
  blogId,
  parentCommentId,
  pageSize = 10,
  initialLoad = true,
}: UseCommentListOptions) {
  const scopeKey = JSON.stringify([blogId ?? null, parentCommentId ?? null, pageSize])
  const [state, setState] = useState<CommentListState>(() => ({
    scopeKey,
    page: 1,
    started: initialLoad,
    total: 0,
    pages: {},
  }))
  const currentState: CommentListState = state.scopeKey === scopeKey
    ? state
    : { scopeKey, page: 1, started: initialLoad, total: 0, pages: {} }
  const { page, started, total, pages } = currentState

  const updateCurrentState = useCallback((update: (current: CommentListState) => CommentListState) => {
    setState((current) => update(
      current.scopeKey === scopeKey
        ? current
        : { scopeKey, page: 1, started: initialLoad, total: 0, pages: {} },
    ))
  }, [initialLoad, scopeKey])

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

  const { data: response, loading, error } = useApiGet<CommentListResponse>(url, {
    keepPreviousData: false,
    onSuccess: (result) => {
      updateCurrentState((current) => ({
        ...current,
        total: result.pagination?.totalSize ?? 0,
        pages: { ...current.pages, [page]: result.data ?? [] },
      }))
    },
  })

  const comments = useMemo(() => {
    const currentPages = response
      ? { ...pages, [page]: response.data ?? [] }
      : pages
    return combineCommentPages(currentPages)
  }, [page, pages, response])

  const loadMore = useCallback(() => {
    if (loading || (started && page > 1 && comments.length >= total)) return
    updateCurrentState((current) => ({
      ...current,
      started: true,
      page: current.started ? current.page + 1 : current.page,
    }))
  }, [comments.length, loading, page, started, total, updateCurrentState])

  const replace = useCallback((next: CommentResponse[]) => {
    const nextPages: Record<number, CommentResponse[]> = {}
    for (let index = 0; index < next.length; index += pageSize) {
      nextPages[Math.floor(index / pageSize) + 1] = next.slice(index, index + pageSize)
    }
    updateCurrentState((current) => ({ ...current, pages: nextPages, total: next.length }))
  }, [pageSize, updateCurrentState])

  const prepend = useCallback((comment: CommentResponse) => {
    updateCurrentState((current) => ({
      ...current,
      pages: {
        ...current.pages,
        1: [comment, ...(current.pages[1] ?? [])],
      },
      total: current.total + 1,
    }))
  }, [updateCurrentState])

  return {
    comments,
    total: response?.pagination?.totalSize ?? total,
    loading,
    error,
    hasMore: (response?.pagination?.totalSize ?? total) > comments.length,
    loadMore,
    replace,
    prepend,
  }
}
