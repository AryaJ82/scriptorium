import Link from 'next/link'
import { ScriptoriumLogo } from '@/components/ScriptoriumLogo'

const COLUMNS = [
	{
		heading: 'Explore',
		links: [
			{ href: '/playground', label: 'Playground' },
			{ href: '/templates', label: 'Templates' },
			{ href: '/blog', label: 'Blog' },
		],
	},
	{
		heading: 'Account',
		links: [
			{ href: '/users/dashboard', label: 'Dashboard' },
			{ href: '/users/profile', label: 'Profile' },
		],
	},
	{
		heading: 'Resources',
		links: [{ href: '/info', label: 'About Scriptorium' }],
	},
]

export function SiteFooter() {
	return (
		<footer className="border-t border-border/80">
			<div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.6fr_repeat(3,1fr)]">
				<div className="flex flex-col gap-3">
					<ScriptoriumLogo />
					<p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
						Write, run, and preserve your code as reusable templates — then share what you learn.
					</p>
				</div>

				{COLUMNS.map((col) => (
					<div key={col.heading} className="flex flex-col gap-3">
						<h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
							{col.heading}
						</h3>
						<ul className="flex flex-col gap-2">
							{col.links.map((link) => (
								<li key={link.href}>
									<Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>

			<div className="border-t border-border/60">
				<div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<p>© {new Date().getFullYear()} Scriptorium. All rights reserved.</p>
					<p className="font-mono">Built for geeks, nerds, and enthusiasts.</p>
				</div>
			</div>
		</footer>
	)
}

