'use client'

import { type KeyboardEvent, useCallback, useState } from 'react'
import { useTagEdit } from '@/lib/useTagEdit'

export interface UseListSearchOptions {
  initialSortBy?: string
  initialSortOrder?: string
  initialPageSize?: number
}

/**
 * Shared search/filter/sort/pagination state and handlers, extracted from the
 * near-identical logic duplicated across the blog and template list pages.
 *
 * Page-specific-only filters (e.g. the templates page's `language` select) stay
 * local to that page and are merged in via `buildParams(extra)`.
 */
export function useListSearch(options?: UseListSearchOptions) {
  const [titleQuery, setTitleQueryState] = useState<string>('')
  const [contentQuery, setContentQueryState] = useState<string>('')
  const [authorQuery, setAuthorQueryState] = useState<string>('')

  const { tagDraft, setTagDraft, tags: tagsQuery, addTag, removeTag } = useTagEdit()

  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSizeState] = useState<number>(options?.initialPageSize ?? 10)
  const [sortByQuery, setSortByQueryState] = useState<string>(options?.initialSortBy ?? 'createdAt')
  const [orderByQuery, setOrderByQueryState] = useState<string>(options?.initialSortOrder ?? 'desc')

  const beginSearch = useCallback(() => {
    setPage(1)
  }, [])

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
  }, [])

  const handleTitleChange = useCallback((value: string) => {
    setTitleQueryState(value)
    beginSearch()
  }, [beginSearch])

  const handleContentChange = useCallback((value: string) => {
    setContentQueryState(value)
    beginSearch()
  }, [beginSearch])

  const handleAuthorChange = useCallback((value: string) => {
    setAuthorQueryState(value)
    beginSearch()
  }, [beginSearch])

  const handleSortByChange = useCallback((value: string) => {
    setSortByQueryState(value)
    beginSearch()
  }, [beginSearch])

  const handleOrderChange = useCallback((value: string) => {
    setOrderByQueryState(value)
    beginSearch()
  }, [beginSearch])

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSizeState(Number(value))
    beginSearch()
  }, [beginSearch])

  const handleAddTag = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    addTag(event)
    beginSearch()
  }, [beginSearch, addTag])

  const handleRemoveTag = useCallback((tag: string) => {
    removeTag(tag)
    beginSearch()
  }, [beginSearch, removeTag])

  const buildParams = useCallback((extra?: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    if (titleQuery) params.append('title', titleQuery)
    if (contentQuery) params.append('content', contentQuery)
    if (authorQuery) params.append('author', authorQuery)
    if (tagsQuery.length > 0) params.append('tags', tagsQuery.join(','))
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        if (value) params.append(key, value)
      }
    }
    params.append('sortBy', sortByQuery)
    params.append('sortOrder', orderByQuery)
    params.append('page', page.toString())
    params.append('pageSize', pageSize.toString())
    return params
  }, [titleQuery, contentQuery, authorQuery, tagsQuery, sortByQuery, orderByQuery, page, pageSize])

  return {
    titleQuery,
    contentQuery,
    authorQuery,
    tagDraft,
    setTagDraft,
    tagsQuery,
    page,
    pageSize,
    sortByQuery,
    orderByQuery,
    handleTitleChange,
    handleContentChange,
    handleAuthorChange,
    handleSortByChange,
    handleOrderChange,
    handlePageSizeChange,
    handleAddTag,
    handleRemoveTag,
    handlePageChange,
    buildParams,
  }
}
