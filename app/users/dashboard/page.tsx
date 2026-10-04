'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserSession } from '@/contexts/UserSessionContext'
import { DisplayAvatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useEffect, useState } from 'react'
import { useApiGet } from '@/lib/useApiGet'

type DashboardData = {
  profile: {
    id: string
    username: string
    avatarUrl?: string | null
    role?: string
    createdAt: string
  }
  templates: Array<{
    id: string
    title: string
    description?: string
    language: string
    updatedAt: string
    tags: Array<{ name: string }>
  }>
  blogs: Array<{
    id: number
    title: string
    content: string
    updatedAt: string
    tags: Array<{ name: string }>
  }>
  comments: Array<{
    id: number
    content: string
    updatedAt: string
    blogPost: { id: number; title: string }
  }>
  savedTemplates: Array<{
    id: string
    title: string
    description?: string
    language: string
    updatedAt: string
    author: { username: string }
    tags: Array<{ name: string }>
  }>
}

const tabs = ["Overview", "Templates", "Blog posts", "Comments", "Saved templates"] as const;
type Tab = typeof tabs[number];

export default function DashboardPage() {
  const router = useRouter();
  const { session, sessionReady, authFetch } = useUserSession();
  const [tab, setTab] = useState<Tab>("Overview");
  const [search, setSearch] = useState("");
  const dashboardUrl = session.isAuthenticated && session.id
    ? `/api/users/${session.id}/dashboard${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`
    : null;
  const { data: rawData, error, loading: isLoading, refetch: mutate } = useApiGet<{ data: DashboardData }, { data: DashboardData }>(dashboardUrl, {
    fetcher: authFetch,
    notOkMessage: "Unable to load dashboard",
  });

  const data = rawData?.data;

  useEffect(() => {
    if (sessionReady && !session.isAuthenticated) router.replace("/users/login");
  }, [sessionReady, session.isAuthenticated, router]);

  if (!sessionReady) return <main className="mx-auto max-w-6xl px-4 py-10"><div className="h-40 animate-pulse rounded-2xl bg-muted" /></main>;
  if (!session.isAuthenticated) return null;

  if (isLoading && !data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </main>
    )
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
          {error ?? 'Unable to load dashboard.'}
        </div>
      </main>
    )
  }


  const collections =
    tab === 'Templates'
      ? data.templates
      : tab === 'Blog posts'
        ? data.blogs
        : tab === 'Comments'
          ? data.comments
          : tab === 'Saved templates'
            ? data.savedTemplates
            : []

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <DisplayAvatar user={data.profile} size="lg" />

          <div>
            <p className="text-sm text-muted-foreground">Your workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {data.profile.username}
            </h1>
            <p className="text-sm text-muted-foreground">
              {data.profile.role ?? 'User'} · Member since{' '}
              {new Date(data.profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild>
            <Link href="/profile">Edit profile</Link>
          </Button>
        </div>
      </header>

      <nav
        className="flex gap-2 overflow-x-auto border-b border-border"
        aria-label="Dashboard sections"
      >
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium ${tab === item
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {item}
          </button>
        ))}
      </nav>


      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="dashboard-search" className="text-sm font-medium">
          Search {tab === 'Overview' ? 'your content' : tab.toLowerCase()}
        </label>
        <div className="flex w-full gap-2 sm:max-w-md">
          <input
            id="dashboard-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or description"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          {search && (
            <Button variant="ghost" onClick={() => setSearch('')}>
              Clear
            </Button>
          )}
        </div>
      </div>


      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Templates', data.templates.length],
          ['Blog posts', data.blogs.length],
          ['Comments', data.comments.length],
          ['Saved templates', data.savedTemplates.length],
        ].map(([label, count]) => (
          <button
            key={String(label)}
            type="button"
            onClick={() => setTab(label as Tab)}
            className="rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/50"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{count}</p>
          </button>
        ))}
      </section>

      {search && <p className="text-sm text-muted-foreground">Showing matches for “{search}”.</p>}

      {tab === 'Overview' ? (
        <section className="grid gap-4 md:grid-cols-2">
          <Collection
            title="Recent templates"
            items={data.templates.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={`/templates/${item.id}`}
                className="rounded-lg border border-border p-4 hover:bg-muted/50"
              >
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.description || 'No description'}
                </p>
              </Link>
            ))}
            empty="Create your first template to see it here."
          />
          <Collection
            title="Recent blog posts"
            items={data.blogs.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={`/blog/${item.id}`}
                className="rounded-lg border border-border p-4 hover:bg-muted/50"
              >
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.content}</p>
              </Link>
            ))}
            empty="Publish your first post to see it here."
          />
        </section>
      ) : (
        <section>
          <h2 className="mb-4 text-xl font-semibold">{tab}</h2>
          <Collection
            title=""
            empty={`No ${tab.toLowerCase()} yet.`}
            items={collections.map((item: any) => (
              <div key={item.id} className="rounded-lg border border-border bg-card p-4">
                <p className="font-medium">{item.title ?? item.blogPost?.title ?? 'Comment'}</p>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                  {item.content ?? item.description ?? `By ${item.author?.username ?? 'you'}`}
                </p>
              </div>
            ))}
          />
        </section>
      )}
    </main>
  )
}


function Collection({
  title,
  items,
  empty,
}: {
  title: string
  items: React.ReactNode[]
  empty: string
}) {
  return (
    <section className="flex flex-col gap-3">
      {title && <h2 className="text-xl font-semibold">{title}</h2>}

      {items.length ? (
        items
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      )}
    </section>
  )
}
