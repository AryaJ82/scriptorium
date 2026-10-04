'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { useUserSession } from '@/contexts/UserSessionContext'
import { cn } from '@/lib/utils'

import { ThemeToggle } from './ThemeToggle'
import { ScriptoriumLogo } from './ScriptoriumLogo'
import { UserMenu } from './UserMenu'
import { Button } from './ui/Button'
import { SaveBlogDialogue } from './SaveBlogDialogue'

const NAV = [
	{ href: '/playground', label: 'Playground' },
	{ href: '/templates', label: 'Templates' },
	{ href: '/blog', label: 'Blog' },
	{ href: '/info', label: 'Info' },
]

export function SiteHeader() {
	const pathname = usePathname()
	const { session } = useUserSession()
	const [mobileOpen, setMobileOpen] = useState(false)
	const isAdmin = session.isAuthenticated && session.role === 'ADMIN'
	const links = isAdmin ? [...NAV, { href: '/admin/moderation', label: 'Moderation' }] : NAV
	const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

	return (
		<header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
				<Link href="/" aria-label="Scriptorium home" onClick={() => setMobileOpen(false)}>
					<ScriptoriumLogo />
				</Link>

				<nav aria-label="Primary navigation" className="ml-4 hidden items-center gap-1 md:flex">
					{links.map((item) => {
						const active = isActive(item.href)

						return (
							<Link
								key={item.href}
								href={item.href}
								aria-current={active ? 'page' : undefined}
								className={cn(
									'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
									active
										? 'border-primary/30 bg-primary/15 text-foreground shadow-sm'
										: 'border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
								)}
							>
								{item.label}
							</Link>
						)
					})}
				</nav>

				<div className="ml-auto flex items-center gap-2">
					<div className="hidden sm:block">
						<SaveBlogDialogue>
							<Button variant="edit">Create Post</Button>
						</SaveBlogDialogue>
					</div>
					<ThemeToggle />
					<div className="hidden sm:block">
						<UserMenu />
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden"
						aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
						aria-expanded={mobileOpen}
						onClick={() => setMobileOpen((open) => !open)}
					>
						{mobileOpen ? <X /> : <Menu />}
					</Button>
				</div>
			</div>

			{mobileOpen && (
				<div className="border-t border-border bg-background px-4 py-4 md:hidden">
					<nav aria-label="Mobile navigation" className="flex flex-col gap-1">
						{links.map((item) => {
							const active = isActive(item.href)

							return (
								<Link
									key={item.href}
									href={item.href}
									aria-current={active ? 'page' : undefined}
									onClick={() => setMobileOpen(false)}
									className={cn(
										'rounded-lg px-3 py-3 text-sm font-medium',
										active ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
									)}
								>
									{item.label}
								</Link>
							)
						})}

						<div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
							<SaveBlogDialogue>
								<Button variant="edit" className="flex-1">
									Create Post
								</Button>
							</SaveBlogDialogue>
							<div className="sm:hidden">
								<UserMenu />
							</div>
						</div>
					</nav>
				</div>
			)}
		</header>
	)
}

