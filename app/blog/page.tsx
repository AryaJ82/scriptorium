'use client'

import { type KeyboardEvent, useCallback, useEffect, useState } from 'react'
import { FileSearch, Loader, User, Tag, Search, FileText, X } from 'lucide-react'
import SearchBar from '@/components/ui/SearchBar'
import BlogPostCard from '@/components/BlogCard'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/Empty'

import { BlogResponse, validBlogSortFields, validSortOrders } from '@/utils/interfaces'
import { useTagEdit } from '@/lib/useTagEdit'

export default function BlogPage() {
  const [titleQuery, setTitleQuery] = useState<string>('');
  const [contentQuery, setContentQuery] = useState<string>('');
  const [authorQuery, setAuthorQuery] = useState<string>('');

  const { tagDraft, setTagDraft, tags, addTag, removeTag } = useTagEdit();
  const tagsQuery = tags;

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortByQuery, setSortByQuery] = useState<string>('createdAt');
  const [orderByQuery, setOrderByQuery] = useState<string>('desc');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [results, setResults] = useState<BlogResponse[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const beginSearch = useCallback(() => {
    setPage(1);
    setLoading(true);
    setError(null);
  }, []);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    setLoading(true);
    setError(null);
  }, []);

  const handleTitleChange = useCallback((value: string) => {
    setTitleQuery(value);
    beginSearch();
  }, [beginSearch]);

  const handleContentChange = useCallback((value: string) => {
    setContentQuery(value);
    beginSearch();
  }, [beginSearch]);

  const handleAuthorChange = useCallback((value: string) => {
    setAuthorQuery(value);
    beginSearch();
  }, [beginSearch]);

  const handleSortByChange = useCallback((value: string) => {
    setSortByQuery(value);
    beginSearch();
  }, [beginSearch]);

  const handleOrderChange = useCallback((value: string) => {
    setOrderByQuery(value);
    beginSearch();
  }, [beginSearch]);

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(Number(value));
    beginSearch();
  }, [beginSearch]);

  const handleAddTag = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    addTag(event);
    beginSearch();
  }, [beginSearch, addTag]);

  const handleRemoveTag = useCallback((tag: string) => {
    removeTag(tag);
    beginSearch();
  }, [beginSearch, removeTag]);

  useEffect(() => {
    const controller = new AbortController();

    const queryParams = new URLSearchParams();
    if (titleQuery) queryParams.append('title', titleQuery);
    if (contentQuery) queryParams.append('content', contentQuery);
    if (authorQuery) queryParams.append('author', authorQuery);
    if (tagsQuery.length > 0) queryParams.append('tags', tagsQuery.join(','));
    queryParams.append('sortBy', sortByQuery);
    queryParams.append('sortOrder', orderByQuery);
    queryParams.append('page', page.toString());
    queryParams.append('pageSize', pageSize.toString());

    fetch(`/api/blogs?${queryParams.toString()}`, {
      method: 'GET',
      signal: controller.signal,
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? 'Failed to fetch blog posts');
        setResults(body.data ?? []);
        setTotalResults(body.pagination?.totalSize ?? 0);
        setTotalPages(body.pagination?.totalPages ?? 1);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to fetch blog posts. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      })

    return () => controller.abort()
  }, [titleQuery, contentQuery, authorQuery, tagsQuery, sortByQuery, orderByQuery, page, pageSize]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + results.length, totalResults);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="text-muted-foreground">
          Read and discuss code. Search by title, content, tags, or the templates a post references.
        </p>
      </div>

      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
        Search
      </p>

      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <div className="relative">
            <SearchBar
              value={titleQuery}
              onChange={handleTitleChange}
              placeholder="e.g. binary search"
              className="pl-8"
              icon={Search}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Author</label>
          <div className="relative">
            <SearchBar
              value={authorQuery}
              onChange={handleAuthorChange}
              placeholder="e.g. @johndoe"
              className="pl-8"
              icon={User}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-2.5">
        <label className="text-xs font-medium text-muted-foreground">Content</label>
        <div className="relative">
          <SearchBar
            value={contentQuery}
            onChange={handleContentChange}
            placeholder="Search within content…"
            className="pl-8"
            icon={FileText}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Tags</label>
        <div className="relative">
          <SearchBar
            value={tagDraft}
            onChange={setTagDraft}
            onKeyDown={(e) => handleAddTag(e)}
            placeholder="Type a tag and press Enter…"
            className="pl-8"
            icon={Tag}
          />
        </div>
        {tagsQuery.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {tagsQuery.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleRemoveTag(t)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors"
              >
                {t} <X className="h-3 w-3 opacity-50" />
              </button>
            ))}
          </div>
        )}
      </div>

      <hr className="my-3.5 border-border/60" />

      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
        Sort & Filter
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Sort by</label>
          <Select value={sortByQuery} onValueChange={handleSortByChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {validBlogSortFields.map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Order</label>
          <Select value={orderByQuery} onValueChange={handleOrderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              {validSortOrders.map((order) => (
                <SelectItem key={order} value={order}>
                  {order}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Page size</label>
          <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-border bg-card p-4 mt-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Searching posts…</p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="font-mono text-xs text-muted-foreground">
              {totalResults === 0
                ? '0 posts'
                : `Showing ${startIndex + 1}–${endIndex} of ${totalResults} post${totalResults === 1 ? '' : 's'}`}
            </p>
            <div className="inline-flex items-center gap-2">
              <button
                className="px-3 py-1 rounded border bg-background text-sm disabled:opacity-50"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>

              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>

              <button
                className="px-3 py-1 rounded border bg-background text-sm disabled:opacity-50"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="mt-6 flex flex-col gap-4">
              {results.map((post, index) => (
                <BlogPostCard
                  key={post.id}
                  post={post}
                  updatePost={(updated: BlogResponse) => setResults(prev => prev.map((post, i) => (i === index ? updated : post))
                  )}
                />
              ))}
            </div>
          ) : (
            <Empty className="mt-6 rounded-lg border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileSearch />
                </EmptyMedia>
                <EmptyTitle>No posts found</EmptyTitle>
                <EmptyDescription>
                  Try a different search term.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </>
      )}
    </div>
  )
}
