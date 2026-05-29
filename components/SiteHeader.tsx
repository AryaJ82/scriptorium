'use client'

import { useUserSession } from "@/contexts/UserSessionContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
    // { href: '/playground', label: 'Playground' },
    // { href: '/templates', label: 'Templates' },
    // { href: '/blog', label: 'Blog' },
    { href: '/info', label: 'Info' },
    { href: '/protected', label: 'Protected' },
    { href: '/users/login', label: 'Login' },
]

export function SiteHeader() {
    const pathname = usePathname();
    const { session } = useUserSession();
    // const isAdmin = session.isAuthenticated && session.role === "ADMIN"

    //const links = isAdmin ? [...NAV, { href: '/admin', label: 'Moderation' }] : NAV
    const links = NAV;
    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">

                <Link href="/" aria-label="Home">
                    Home
                </Link>

                <nav className="ml-4 hidden items-center gap-1 md:flex">
                    {links.map((item) => {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className='bg-secondary text-foreground'>
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );

}