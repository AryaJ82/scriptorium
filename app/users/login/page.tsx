"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.25),transparent_35%),linear-gradient(180deg,#020617,#0f172a_55%,#111827)] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-[0_25px_80px_rgba(15,23,42,0.55)] backdrop-blur">
        <LoginForm
          onSuccess={async () => {
            router.push("/");
          }}
          subtitle="Manage templates and collaborate with your team using your account credentials."
          title="Log in to your account"
        />
      </div>
    </main>
  );
}
