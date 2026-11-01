
    
  
'use client'

import Link from 'next/link'
import { ArrowRight, Bookmark, Play, Share2, type LucideIcon } from 'lucide-react'

const STEPS: {
  number: string
  icon: LucideIcon
  title: string
  body: string
  href?: string
  action?: string
}[] = [
  { number: '01', icon: Play, title: 'Run the sample', body: 'Open the editor and run the ready-to-go Python greeting. No account or input required.', href: '/playground', action: 'Open playground' },
  { number: '02', icon: Bookmark, title: 'Save your work', body: 'Choose “Save as template” when you are happy. Sign in or create a free account; your code comes back with you.' },
  { number: '03', icon: Share2, title: 'See your template', body: 'After saving, Scriptorium opens your new template so you can run it again, edit it, or share its link.' },
]

export function GettingStarted() {
  return (
    <section aria-labelledby="getting-started-title" className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">A simple path in</p>
          <h2 id="getting-started-title" className="mt-3 font-serif text-3xl font-semibold tracking-tight">Start with one small idea</h2>
          <p className="mt-2 text-muted-foreground">Try a working sample first. An account is only needed when you choose to save.</p>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.number} className="group rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary/50">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{step.number}</span>
                <step.icon className="size-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-8 font-serif text-xl font-medium">{step.title}</h3>
              <p className="mt-2 min-h-12 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              {step.href && step.action ? (
                <Link href={step.href} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline">
                  {step.action}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              ) : (
                <p className="mt-5 text-sm font-medium text-muted-foreground">
                  {step.number === '02' ? 'Account required to save' : 'Opens automatically after saving'}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
