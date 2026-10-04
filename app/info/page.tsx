const highlights = [
  {
    eyebrow: '01 / write',
    title: 'A focused workspace',
    description:
      'Draft code, notes, and snippets in a clean environment designed to keep your attention on the work itself.',
  },
  {
    eyebrow: '02 / run',
    title: 'Execute without friction',
    description:
      'Test ideas in real time, inspect results, and iterate quickly without the overhead of a full local setup.',
  },
  {
    eyebrow: '03 / keep',
    title: 'Save what matters',
    description:
      'Preserve reusable patterns, templates, and experiments so the best parts of your workflow remain easy to revisit.',
  },
];

const available = [
  'Reusable auth UI and form patterns',
  'Shared session state across the app',
  'Protected routes and example integrations',
  'Template and blog surfaces for the public experience',
];

export default function InfoPage() {
  return (
    <main className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-grid opacity-40 mask-[radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          Project info
        </div>

        <h1 className="mt-6 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          A modern scriptorium for code, ideas, and iteration.
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Scriptorium blends the ease of a scratchpad with the structure of a
          reusable library. The goal is simple: write, run, remix, and preserve
          the work that matters most.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.eyebrow}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {item.eyebrow}
              </p>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                What is available
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground">
                A foundation for a richer product experience.
              </h2>
              <ul className="mt-5 space-y-3 text-base text-muted-foreground">
                {available.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="rounded-2xl border border-border bg-secondary/40 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                In progress
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>• Auth flow and protected app examples</li>
                <li>• User-owned templates and saved collections</li>
                <li>• Deeper collaboration and sharing workflows</li>
              </ul>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
