'use client'

import { FileText, Search, Tag, User, X } from 'lucide-react'
import SearchBar from '@/components/ui/SearchBar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { LANG_CONFIG, LANGUAGES, validBlogSortFields, validSortOrders, validTemplateSortFields } from '@/utils/interfaces'
import type { KeyboardEvent } from 'react'

type SearchState = {
    titleQuery: string
    contentQuery: string
    authorQuery: string
    tagDraft: string
    tagsQuery: string[]
    sortByQuery: string
    orderByQuery: string
    pageSize: number
    setTagDraft: (value: string) => void
    handleTitleChange: (value: string) => void
    handleContentChange: (value: string) => void
    handleAuthorChange: (value: string) => void
    handleSortByChange: (value: string) => void
    handleOrderChange: (value: string) => void
    handlePageSizeChange: (value: string) => void
    handleAddTag: (event: KeyboardEvent<HTMLInputElement>) => void
    handleRemoveTag: (tag: string) => void
}

interface SearchFiltersProps extends SearchState {
    kind: 'blog' | 'template'
    language?: string
    onLanguageChange?: (value: string) => void
}

export function SearchFilters({ kind, language, onLanguageChange, ...search }: SearchFiltersProps) {
    const isTemplate = kind === 'template'
    const sortFields = isTemplate ? validTemplateSortFields : validBlogSortFields

    return (
        <>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Search</p>
            <div className="mb-2.5 grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Title</label>
                    <SearchBar value={search.titleQuery} onChange={search.handleTitleChange} placeholder="e.g. binary search" className="pl-8" icon={Search} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Author</label>
                    <SearchBar value={search.authorQuery} onChange={search.handleAuthorChange} placeholder="e.g. @johndoe" className="pl-8" icon={User} />
                </div>
            </div>
            <div className="mb-2.5 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Content</label>
                <SearchBar value={search.contentQuery} onChange={search.handleContentChange} placeholder="Search within content…" className="pl-8" icon={FileText} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tags</label>
                <SearchBar value={search.tagDraft} onChange={search.setTagDraft} onKeyDown={search.handleAddTag} placeholder="Type a tag and press Enter…" className="pl-8" icon={Tag} />
                {search.tagsQuery.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                        {search.tagsQuery.map((tag) => (
                            <button key={tag} type="button" onClick={() => search.handleRemoveTag(tag)} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-muted">
                                {tag} <X className="h-3 w-3 opacity-50" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <hr className="my-3.5 border-border/60" />
            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Sort & Filter</p>
            <div className="grid grid-cols-3 gap-2.5">
                {isTemplate && onLanguageChange ? (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Language</label>
                        <Select value={language ?? 'all'} onValueChange={onLanguageChange}>
                            <SelectTrigger><SelectValue placeholder="All languages" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All languages</SelectItem>
                                {LANGUAGES.map((item) => <SelectItem key={item} value={item}>{LANG_CONFIG[item].displayLabel}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                ) : null}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Sort by</label>
                    <Select value={search.sortByQuery} onValueChange={search.handleSortByChange}>
                        <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                        <SelectContent>{sortFields.map((field) => <SelectItem key={field} value={field}>{field}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Order</label>
                    <Select value={search.orderByQuery} onValueChange={search.handleOrderChange}>
                        <SelectTrigger><SelectValue placeholder="Order" /></SelectTrigger>
                        <SelectContent>{validSortOrders.map((order) => <SelectItem key={order} value={order}>{order}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                {!isTemplate && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Page size</label>
                        <Select value={String(search.pageSize)} onValueChange={search.handlePageSizeChange}>
                            <SelectTrigger><SelectValue placeholder="Per page" /></SelectTrigger>
                            <SelectContent>{[10, 20, 50].map((size) => <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        </>
    )
}

type SearchPaginationProps = {
    page: number;
    totalPages: number;
    pageSize: number;
    totalResults: number;
    resultCount: number;
    noun: string;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: string) => void
}

export function SearchPagination(
    {
        page, totalPages, pageSize, totalResults, resultCount, noun, onPageChange, onPageSizeChange
    }: SearchPaginationProps) {
    const start = totalResults === 0 ? 0 : (page - 1) * pageSize + 1
    const end = Math.min((page - 1) * pageSize + resultCount, totalResults)
    return (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs text-muted-foreground">{totalResults === 0 ? `0 ${noun}` : `Showing ${start}–${end} of ${totalResults} ${noun}${totalResults === 1 ? '' : 's'}`}</p>
            <div className="flex items-center gap-3">
                <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="Per page" /></SelectTrigger>
                    <SelectContent>{[10, 20, 50].map((size) => <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>)}</SelectContent>
                </Select>
                <div className="inline-flex items-center gap-2">
                    <button className="rounded border bg-background px-3 py-1 text-sm disabled:opacity-50" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>Prev</button>
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <button className="rounded border bg-background px-3 py-1 text-sm disabled:opacity-50" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next</button>
                </div>
            </div>
        </div>
    )
}
