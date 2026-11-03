export default function InfoPage() {
  return (
    <main className="relative overflow-hidden border-b border-border">
      <div className="absolute md:items-center inset-0 bg-grid opacity-40 mask-[radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <div className="relative md:items-center mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            About the project
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            A space to write and run code.
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Scriptorium is a code playground built with Next.js, TypeScript, and Tailwind CSS. Try ideas, test snippets, and see the results in one place.
          </p>
        </header>

          <div className="flex justify-center">

            <nav aria-label="Social links" className="flex flex-wrap gap-3 md:flex-row">
              <a
                href="https://github.com/AryaJ82/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                GitHub <span aria-hidden="true">↗</span>
              </a>
              <a
                href="https://www.linkedin.com/in/aryaj82/"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
            </nav>
          </div>

      </div>
    </main>
  );
}
