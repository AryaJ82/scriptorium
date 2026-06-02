'use client'

import { FileSearch, Loader } from 'lucide-react'
import { TemplateCard } from "@/components/TemplateCard";
import { Toaster, toast } from 'sonner'
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/Empty";
import SearchBar from "@/components/ui/SearchBar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { LANG_CONFIG, LANGUAGES, TemplateResponse, validSortOrders, validTemplateSortFields } from "@/utils/interfaces";
import { useCallback, useEffect, useState } from "react";
import { validateTagValue } from '@/utils/inputValidation/generalValidation';
import { TagBadge } from '@/components/TagBadge';

export default function TemplatesPage() {
    // Queries
    const [titleQuery, setTitleQuery] = useState<string>('');
    const [contentQuery, setContentQuery] = useState<string>('');
    const [authorQuery, setAuthorQuery] = useState<string>('');
    const [languageQuery, setLanguageQuery] = useState('all');
    const [tagsQuery, setTagsQuery] = useState<string[]>([]);
    const [tagDraft, setTagDraft] = useState<string>('');

    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(6);
    const [sortByQuery, setSortByQuery] = useState<string>('createdAt');
    const [orderByQuery, setOrderByQuery] = useState<string>('desc');

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const [results, setResults] = useState<TemplateResponse[]>([]);

    const addTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>, tagDraft: string) => {
        if ((e.key === 'Enter' || e.key === ',' || e.key === "#" || e.key === ' ' || e.key === '&' || e.key === '$') && tagDraft.trim()) {
            e.preventDefault();
            const newTag = tagDraft.trim().toLowerCase();
            const error = validateTagValue(newTag);
            if (error) {
                toast.error(error.message);
                return;
            }

            if (!tagsQuery.includes(newTag)) setTagsQuery([...tagsQuery, newTag]);
            setTagDraft('');
        }
    }, [tagDraft, tagsQuery]);


    useEffect(() => {
        try {
            setLoading(true);

            // Build query params
            const params = new URLSearchParams();
            if (titleQuery) params.append('title', titleQuery);
            if (contentQuery) params.append('content', contentQuery);
            if (authorQuery) params.append('author', authorQuery);

            if (languageQuery && languageQuery !== 'all') params.append('language', languageQuery);
            if (tagsQuery.length > 0) params.append('tags', tagsQuery.join(','));
            params.append('sortBy', sortByQuery);
            params.append('sortOrder', orderByQuery);
            params.append('page', page.toString());
            params.append('pageSize', pageSize.toString());

            const controller = new AbortController();
            fetch(`/api/templates?${params.toString()}`,
                {
                    method: 'GET',
                    signal: controller.signal,
                })
                .then(async (res) => {
                    if (!res.ok) throw new Error('Failed to fetch templates');
                    const data = await res.json();
                    setResults(data.templates);
                })
                .catch(err => {
                    console.error(err);
                    setError(err instanceof Error ? err.message : 'Failed to fetch templates. Please try again later.');
                }).finally(() => {
                    setLoading(false);
                });

            return () => controller.abort();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch templates. Please try again later.');
        }
    }, [titleQuery, contentQuery, authorQuery, languageQuery, tagsQuery, sortByQuery, orderByQuery, page, pageSize]);

    // Reset to first page when query or pageSize changes
    useEffect(() => {
        setPage(1);
    }, [titleQuery, languageQuery, tagsQuery, pageSize]);

    const totalResults = results.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalResults);
    const paginatedResults = results.slice(startIndex, endIndex);

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="flex flex-col gap-2">
                <h1 className="font-serif text-3xl font-semibold tracking-tight">
                    Template Library
                </h1>
                <p className="text-muted-foreground">
                    Search across every public template by title, tags, or content.
                </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 flex-col gap-3">

                    <SearchBar
                        value={titleQuery}
                        onChange={setTitleQuery}
                        placeholder="Search titles…"
                        className="flex-1"
                    />
                    <SearchBar
                        value={contentQuery}
                        onChange={setContentQuery}
                        placeholder="Search contents…"
                        className="flex-1"
                    />
                    <SearchBar
                        value={authorQuery}
                        onChange={setAuthorQuery}
                        placeholder="Search by author username…"
                        className="flex-1"
                    />
                    <SearchBar
                        value={tagDraft}
                        onChange={setTagDraft}
                        onKeyDown={(e) => addTag(e, tagDraft)}
                        placeholder="Filter by tags…"
                        className="flex-1"
                    />

                    {tagsQuery.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {tagsQuery.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTagsQuery(tagsQuery.filter((x) => x !== t))}
                                    className="mt-auto flex flex-wrap items-center gap-1.5 pt-1"
                                >
                                    <TagBadge key={t} label={t} deleteMode={true} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex-col gap-3">
                    <Select value={languageQuery} onValueChange={setLanguageQuery}>
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All languages</SelectItem>
                            {LANGUAGES.map((l) => (
                                <SelectItem key={l} value={l}>
                                    {LANG_CONFIG[l].displayLabel}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={sortByQuery} onValueChange={setSortByQuery}>
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            {validTemplateSortFields.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={orderByQuery} onValueChange={setOrderByQuery}>
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            {validSortOrders.map((l) => (
                                <SelectItem key={l} value={l}>
                                    {l}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="mt-12 flex flex-col items-center justify-center gap-4">
                    <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Searching...</p>
                </div>
            ) : (
                <>
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="font-mono text-xs text-muted-foreground">
                            {totalResults === 0
                                ? '0 templates'
                                : `Showing ${startIndex + 1}–${endIndex} of ${totalResults} template${totalResults === 1 ? '' : 's'}`}
                        </p>

                        <div className="flex items-center gap-3">
                            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Per page" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="6">6 per page</SelectItem>
                                    <SelectItem value="12">12 per page</SelectItem>
                                    <SelectItem value="24">24 per page</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="inline-flex items-center gap-2">
                                <button
                                    className="px-3 py-1 rounded border bg-background text-sm disabled:opacity-50"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                >
                                    Prev
                                </button>

                                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>

                                <button
                                    className="px-3 py-1 rounded border bg-background text-sm disabled:opacity-50"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                    {totalResults > 0 ? (
                        <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {paginatedResults.map((t) => (
                                <TemplateCard key={t.id} template={t} />
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
        </div>
    );
}