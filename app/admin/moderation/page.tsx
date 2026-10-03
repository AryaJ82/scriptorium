"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";

import { Button } from "@/components/ui/Button";
import { useUserSession } from "@/contexts/UserSessionContext";

type BlogReport = {
  id: number;
  title: string;
  content: string;
  author: { username: string };
  blogPost: { id: number; title: string; isHidden: boolean };
};

type CommentReport = {
  id: number;
  title: string;
  content: string;
  author: { username: string };
  comment: {
    id: number;
    content: string;
    isHidden: boolean;
    blogPostId: number;
  };
};

type ReportData = {
  blogReports: BlogReport[];
  commentReports: CommentReport[];
};

export default function ModerationPage() {
  const { session, sessionReady, authFetch } = useUserSession();
  const [tab, setTab] = useState<"blogs" | "comments">("blogs");

  const { data, error, isLoading, mutate } = useSWR<ReportData>(
    session.isAuthenticated && session.role === "ADMIN"
      ? "/api/admin/reports"
      : null,
    async (url: string) => {
      const response = await authFetch(url);
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to load reports");
      }

      return body;
    },
  );

  const hide = async (kind: "blogs" | "comments", id: number) => {
    const response = await authFetch(`/api/admin/${kind}/${id}/hide`, {
      method: "PATCH",
    });

    if (!response.ok) {
      throw new Error("Unable to hide content");
    }

    await mutate();
  };

  if (!sessionReady) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
        <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
      </main>
    );
  }

  if (!session.isAuthenticated || session.role !== "ADMIN") {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">Admin access required</h1>
          <p className="text-muted-foreground">
            You do not have permission to view moderation reports.
          </p>
        </section>
      </main>
    );
  }

  const reports =
    tab === "blogs" ? (data?.blogReports ?? []) : (data?.commentReports ?? []);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Admin workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Moderation reports
          </h1>
        </div>

        <Button variant="outline" onClick={() => mutate()}>
          Refresh
        </Button>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist">
        <Button
          variant={tab === "blogs" ? "default" : "outline"}
          onClick={() => setTab("blogs")}
          role="tab"
          aria-selected={tab === "blogs"}
        >
          Blog posts ({data?.blogReports.length ?? 0})
        </Button>

        <Button
          variant={tab === "comments" ? "default" : "outline"}
          onClick={() => setTab("comments")}
          role="tab"
          aria-selected={tab === "comments"}
        >
          Comments ({data?.commentReports.length ?? 0})
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading reports…</p>}
      {error && <p className="text-destructive">{error.message}</p>}

      {!isLoading && !error && reports.length === 0 && (
        <section className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          No reports in this queue.
        </section>
      )}

      <section className="grid gap-4">
        {tab === "blogs"
          ? (reports as BlogReport[]).map((report) => (
              <article
                key={report.id}
                className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
              >
                <div>
                  <h2 className="font-semibold">{report.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    Reported by {report.author.username}
                  </p>
                </div>

                <p>{report.content || "No additional details."}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <Link
                    className="underline underline-offset-4"
                    href={`/blog/${report.blogPost.id}`}
                  >
                    {report.blogPost.title}
                  </Link>

                  {report.blogPost.isHidden ? (
                    <span className="text-sm text-muted-foreground">
                      Hidden
                    </span>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => hide("blogs", report.blogPost.id)}
                    >
                      Hide post
                    </Button>
                  )}
                </div>
              </article>
            ))
          : (reports as CommentReport[]).map((report) => (
              <article
                key={report.id}
                className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
              >
                <div>
                  <h2 className="font-semibold">{report.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    Reported by {report.author.username}
                  </p>
                </div>

                <p>{report.content || "No additional details."}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <Link
                    className="max-w-xl truncate underline underline-offset-4"
                    href={`/blog/${report.comment.blogPostId}`}
                  >
                    {report.comment.content}
                  </Link>

                  {report.comment.isHidden ? (
                    <span className="text-sm text-muted-foreground">
                      Hidden
                    </span>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => hide("comments", report.comment.id)}
                    >
                      Hide comment
                    </Button>
                  )}
                </div>
              </article>
            ))}
      </section>
    </main>
  );
}
