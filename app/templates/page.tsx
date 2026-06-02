'use client'

import { FileSearch } from 'lucide-react'
import { TemplateCard } from "@/components/TemplateCard";
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
import { LANG_CONFIG, LANGUAGES, TemplateResponse } from "@/utils/interfaces";
import { useEffect, useState } from "react";

export default function TemplatesPage() {
    const [titleQuery, setTitleQuery] = useState<string>('');
    const [languageQuery, setLanguageQuery] = useState('all');
    const [tagsQuery, setTagsQuery] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<TemplateResponse[]>([]);

    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        try {
            setLoading(true);

            // Build query params
            const params = new URLSearchParams();
            if (titleQuery) params.append('title', titleQuery);
            if (languageQuery && languageQuery !== 'all') params.append('language', languageQuery);
            if (tagsQuery.length > 0) params.append('tags', tagsQuery.join(','));

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
    }, [titleQuery, languageQuery, tagsQuery])

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="flex flex-col gap-2">
                <h1 className="font-serif text-3xl font-semibold tracking-tight">
                    Template library
                </h1>
                <p className="text-muted-foreground">
                    Search across every public template by title, tags, or content.
                </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <SearchBar
                    value={titleQuery}
                    onChange={setTitleQuery}
                    placeholder="Search templates…"
                    className="flex-1"
                />
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
            </div>

            {error && (
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            <p className="mt-6 font-mono text-xs text-muted-foreground">
                {results.length} template{results.length === 1 ? '' : 's'}
            </p>

            {results.length > 0 ? (
                <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.map((t) => (
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
        </div>
    );
}