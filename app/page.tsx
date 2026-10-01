'use client'

import Link from 'next/link'
import {
  ArrowRight,
  GitFork,
  MessagesSquare,
  Play,
  Save,
  SquareTerminal,
  TerminalSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TemplateCard } from '@/components/TemplateCard'
import BlogCard from '@/components/BlogCard'
import { useEffect, useState } from 'react'
import { BlogResponse, TemplateResponse } from '@/utils/interfaces'


const FEATURES = [
  {
    icon: SquareTerminal,
    title: 'Many languages, one editor',
    body: 'Write and run Python, JavaScript, TypeScript, C, C++, and Java with syntax highlighting tuned to each language.',
  },
  {
    icon: Play,
    title: 'Execute in real time',
    body: 'Run code instantly, pipe in standard input, and read stdout, compile errors, runtime errors, and timeouts as they happen.',
  },
  {
    icon: Save,
    title: 'Save reusable templates',
    body: 'Keep your best snippets organized with a title, explanation, and tags — then reuse them whenever you need.',
  },
  {
    icon: GitFork,
    title: 'Fork and build on others',
    body: 'Start from a community template, modify it, and save your own forked version with full attribution.',
  },
]

export default function HomePage() {

  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState<boolean>(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [blogsLoading, setBlogsLoading] = useState<boolean>(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);


  useEffect(() => {

    // Build query params
    const params = new URLSearchParams();

    params.append('sortBy', 'createdAt');
    params.append('sortOrder', 'desc');
    params.append('page', '1');
    params.append('pageSize', '4');

    const controller = new AbortController();

    fetch(`/api/templates?${params.toString()}`,
      {
        method: 'GET',
        signal: controller.signal,
      })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch templates');
        const data = await res.json();
        setTemplates(data.data ?? []);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setTemplatesError(err instanceof Error ? err.message : 'Failed to fetch templates. Please try again later.');
      }).finally(() => {
        setTemplatesLoading(false);
      });

    return () => controller.abort();
  }, [])

  
  useEffect(() => {

    // Build query params
    const params = new URLSearchParams();

    params.append('sortBy', 'createdAt');
    params.append('sortOrder', 'desc');
    params.append('page', '1');
    params.append('pageSize', '3');

    const controller = new AbortController();

    fetch(`/api/blogs?${params.toString()}`,
      {
        method: 'GET',
        signal: controller.signal,
      })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch blogs');
        const data = await res.json();
        setBlogs(data.data ?? []);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setBlogsError(err instanceof Error ? err.message : 'Failed to fetch blogs. Please try again later.');
      }).finally(() => {
        setBlogsLoading(false);
      });

    return () => controller.abort();
  }, [])


  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-40 mask-[radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
              <TerminalSquare className="size-3.5 text-primary" />
              write · execute · preserve
            </span>
            <h1 className="text-balance font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              A modern scriptorium for your code
            </h1>
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Write, run, and share code in many languages. Experiment freely,
              refine your work, and preserve it as reusable templates — no setup
              required.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/playground">
                  Open the Playground <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/templates">Browse templates</Link>
              </Button>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              No account needed to write and run code.
            </p>
          </div>

          {/* Code window */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="flex gap-1.5" aria-hidden>
                <span className="size-3 rounded-full bg-destructive/70" />
                <span className="size-3 rounded-full bg-chart-4/70" />
                <span className="size-3 rounded-full bg-chart-2/70" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                main.py
              </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-foreground">
              {`def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


print([fib(i) for i in range(10)])`}
            </pre>
            <div className="border-t border-border bg-secondary/40 px-5 py-3 font-mono text-[13px] text-muted-foreground">
              <span className="text-chart-2">→</span> [0, 1, 1, 2, 3, 5, 8, 13,
              21, 34]
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="font-serif text-lg font-medium">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured templates */}
      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl font-semibold tracking-tight">
                Newest templates
              </h2>
              <p className="mt-1 text-muted-foreground">
                Snippets from the community.
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/templates">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templatesLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`template-skeleton-${index}`}
                  className="h-48 animate-pulse rounded-lg border border-border bg-card"
                />
              ))
            ) : templatesError ? (
              <div className="col-span-full rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
                <p className="font-medium">Unable to load templates right now.</p>
                <p className="mt-1">{templatesError}</p>
              </div>
            ) : (
              templates.map((t) => <TemplateCard key={t.id} template={t} />)
            )}
          </div>
        </div>
      </section>

      {/* Latest posts */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight">
              From the blog
            </h2>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground">
              <MessagesSquare className="size-4" /> Learn from how others build.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/blog">
              Read more <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          {blogsLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`blog-skeleton-${index}`}
                className="h-28 animate-pulse rounded-lg border border-border bg-card"
              />
            ))
          ) : blogsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
              <p className="font-medium">Unable to load the latest posts right now.</p>
              <p className="mt-1">{blogsError}</p>
            </div>
          ) : (
            blogs.map((p) => <BlogCard key={p.id} post={p} updatePost={()=>{}} />)
          )}
        </div>
      </section>
    </>
  )
}
