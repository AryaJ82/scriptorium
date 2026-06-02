'use client'

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
    const [query, setQuery] = useState<string>('');
    const [language, setLanguage] = useState('all');
    const [tags, setTags] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<TemplateResponse[]>([]);

    useEffect(() => {
        try {

        } catch (error) {

        }
    }, [query, language, tags])

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
                    value={query}
                    onChange={setQuery}
                    placeholder="Search templates…"
                    className="flex-1"
                />
                <Select value={language} onValueChange={setLanguage}>
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