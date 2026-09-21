import Link from "next/link";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound({
  title = "Page not found",
  description = "The page you requested does not exist or may have been moved.",
  resource = "page",
}: {
  title?: string;
  description?: string;
  resource?: string;
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm">
          <Compass aria-hidden="true" className="size-8" />
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Error 404</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="text-pretty leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <Home data-icon="inline-start" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blog">
              <ArrowLeft data-icon="inline-start" />
              Browse {resource === "page" ? "content" : "other content"}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
