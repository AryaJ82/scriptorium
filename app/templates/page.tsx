'use client'

import { FileSearch, Loader } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/Empty'
import { TemplateCard } from '@/components/TemplateCard'
import { SearchFilters, SearchPagination } from '@/components/SearchFilters'
import { TemplateResponse, ApiResponse } from '@/utils/interfaces'
import { useApiGet } from '@/lib/useApiGet'
import { useListSearch } from '@/lib/useListSearch'
import { useState } from 'react'


export default function TemplatesPage() {
  const search = useListSearch()
  const [language, setLanguage] = useState('all')

  const { data, loading, error } = useApiGet<ApiResponse<TemplateResponse[]>>(
    `/api/templates?${search
      .buildParams({ language: language === 'all' ? undefined : language })
      .toString()}`,
    { notOkMessage: 'Failed to fetch templates' },
  )

  const results = data?.data ?? []
  const totalResults = data?.pagination?.totalSize ?? 0
  const totalPages = data?.pagination?.totalPages ?? 1

  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    search.handlePageChange(1)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Template Library
        </h1>
        <p className="text-muted-foreground">
          Search across every public template by title, tags, or content.
        </p>
      </div>

      <div className="mt-6">
        <SearchFilters
          kind="template"
          language={language}
          onLanguageChange={handleLanguageChange}
          {...search}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="mt-12 flex flex-col items-center justify-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Searching…</p>
        </div>
      ) : (
        <>
          <SearchPagination
            page={search.page}
            totalPages={totalPages}
            pageSize={search.pageSize}
            totalResults={totalResults}
            resultCount={results.length}
            noun={`template${(results.length === 1 ? '' : 's')}`}
            onPageChange={search.handlePageChange}
            onPageSizeChange={search.handlePageSizeChange}
          />

          {results.length > 0 ? (
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          ) : (
            <Empty className="mt-6 rounded-lg border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileSearch />
                </EmptyMedia>
                <EmptyTitle>No templates found</EmptyTitle>
                <EmptyDescription>
                  Try a different search term or language filter.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </>
      )}
    </main>
  )
}

