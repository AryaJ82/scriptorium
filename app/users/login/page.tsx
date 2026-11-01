"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getPostAuthDestination } from "@/lib/authRedirect";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_38%),linear-gradient(135deg,var(--background),color-mix(in srgb,var(--background)_80%,var(--accent)))] px-4 py-12">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative w-full max-w-md rounded-[1.75rem] border border-border/70 bg-card/80 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <LoginForm
          onSuccess={() => { router.push(getPostAuthDestination(window.location.search)); }}
          subtitle="Manage templates and collaborate with your team using your account credentials."
          title="Log in to your account"
        />
      </div>
    </main>
  );
}
