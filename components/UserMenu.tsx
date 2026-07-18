'use client'

import { useUserSession } from "@/contexts/UserSessionContext";
import Link from "next/link";
import { FileCode2, LogOut, PlusCircle, User } from 'lucide-react'
import { Button } from "./ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import { DisplayAvatar } from "./ui/Avatar";

export function UserMenu() {
  const { session, logout } = useUserSession();

  if (!session.isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/users/login">Log in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/users/signup">Sign up</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center rounded-full outline-none ring-ring focus-visible:ring-2"
          aria-label="Open account menu"
        >
          <DisplayAvatar user={{username:session.username, avatarUrl:session.avatarUrl}} size="md"/>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-mono text-sm">@{session.username}</span>
          {session.role === "ADMIN" && <span className="text-M font-normal text-amber-200 capitalize">
            {session.role}
          </span>}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={"/profile"}>
            <User className="size-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/templates">
            <FileCode2 className="size-4" /> My templates
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/blog/new">
            <PlusCircle className="size-4" /> New blog post
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onSelect={async () => {
            await logout();
          }}
        >
          <LogOut className="size-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
