'use client'

import { useUserSession } from "@/contexts/UserSessionContext";
import Link from "next/link";
import { usePathname } from "next/navigation";


export function SiteHeader() {
    const pathname = usePathname();
    const { session } = useUserSession();
    // const isAdmin = session.isAuthenticated && session.role === "ADMIN"


    return (
        <div>
            <nav className="flex gap-4 py-3 px-4 flex-wrap border-b border-white/10 bg-slate-950/95 backdrop-blur">
                <Link className="text-sm font-semibold text-cyan-300" href="/">
                    Home
                </Link>
                <div className="flex-1" />
                <Link className="text-sm text-slate-200 hover:text-cyan-200" href="/info">
                    Info
                </Link>
                <Link className="text-sm text-slate-200 hover:text-cyan-200" href="/protected">
                    Protected
                </Link>
                <Link className="text-sm text-slate-200 hover:text-cyan-200" href="/users/login">
                    Login
                </Link>
            </nav>
        </div>
    );

}