'use client'

import { FileSearch, Loader } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/Empty'
import BlogPostCard from '@/components/BlogCard'
import { SearchFilters, SearchPagination } from '@/components/SearchFilters'
import { BlogResponse } from '@/utils/interfaces'
import { useApiGet } from '@/lib/useApiGet'
import { useListSearch } from '@/lib/useListSearch'

interface BlogListResponse {
  data: BlogResponse[]
  pagination?: {
    totalSize?: number
    totalPages?: number
  }
}

export default function BlogPage() {
  const search = useListSearch()

  const { data, loading, error, setData } = useApiGet<BlogListResponse>(
    `/api/blogs?${search.buildParams().toString()}`,
    { notOkMessage: 'Failed to fetch blog posts' },
  )

  const results = data?.data ?? []
  const totalResults = data?.pagination?.totalSize ?? 0
  const totalPages = data?.pagination?.totalPages ?? 1

  const updatePost = (updated: BlogResponse) =>
    setData((prev) =>
      prev
        ? {
            ...prev,
            data: prev.data.map((post) =>
              post.id === updated.id ? updated : post,
            ),
          }
        : prev,
    )

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="text-muted-foreground">
          Read and discuss code. Search by title, content, tags, or the templates a
          post references.
        </p>
      </div>

      <div className="mt-6">
        <SearchFilters kind="blog" {...search} />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
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
          <SearchPagination
            page={search.page}
            totalPages={totalPages}
            pageSize={search.pageSize}
            totalResults={totalResults}
            resultCount={results.length}
            noun={`post${(results.length === 1 ? '' : 's')}`}
            onPageChange={search.handlePageChange}
            onPageSizeChange={search.handlePageSizeChange}
          />

          {results.length > 0 ? (
            <div className="mt-6 flex flex-col gap-4">
              {results.map((post) => (
                <BlogPostCard key={post.id} post={post} updatePost={updatePost} />
              ))}
            </div>
          ) : (
            <Empty className="mt-6 rounded-lg border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileSearch />
                </EmptyMedia>
                <EmptyTitle>No posts found</EmptyTitle>
                <EmptyDescription>Try a different search term.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </>
      )}
    </main>
  )
}

