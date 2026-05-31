"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserSession } from "@/contexts/UserSessionContext";

export interface ProtectedSessionCardProps {
  endpoint?: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

interface ProtectedSessionData {
  user?: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  message?: string;
  error?: string;
}

export function ProtectedSessionCard({
  endpoint = "/api/users/session",
  title = "Protected session example",
  subtitle = "This component uses the shared auth context and authenticated fetch helper.",
  description = "If you are signed in, it will request a server-protected endpoint using your current session.",
}: ProtectedSessionCardProps) {
  const { session, authFetch, logout } = useUserSession();
  const { isAuthenticated } = session;
  const [data, setData] = useState<ProtectedSessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  
  useEffect(() => {
    let isActive = true;

    if (!isAuthenticated) {
      setData(null);
      setError(null);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);
    setError(null);

    authFetch(endpoint)
      .then(async (response) => {
        if(!response){
            return;
        }
        const payload = (await response.json()) as ProtectedSessionData;
        
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load protected session data.");
        }

        if (!isActive) {
          return;
        }

        setData(payload);
      })
      .catch((fetchError) => {
        if (!isActive) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Unable to load protected session data.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [authFetch, endpoint, isAuthenticated]);

  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-slate-900/85 p-6 shadow-[0_20px_60px_rgba(8,145,178,0.2)]">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
        Reusable auth example
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>

      {isLoading ? (
        <p className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
          Loading protected session data...
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-50">
          {error}
        </p>
      ) : null}

      {!isAuthenticated ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
          <p className="font-medium text-white">You are not signed in.</p>
          <p className="mt-1">Use the login page to create a session, then return here to see the protected response.</p>
          <Link
            className="mt-3 inline-flex rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
            href="/users/login"
          >
            Go to login
          </Link>
        </div>
      ) : null}

      {isAuthenticated && data ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
            <p className="font-semibold">Protected response received</p>
            <p className="mt-1">{data.message ?? "Session is valid."}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100">
            <p className="font-semibold text-white">Authenticated user</p>
            <ul className="mt-2 space-y-1">
              <li><span className="text-slate-300">Username:</span> {data.user?.username ?? "Unknown"}</li>
              <li><span className="text-slate-300">Role:</span> {data.user?.role ?? "Unknown"}</li>
              <li><span className="text-slate-300">Email:</span> {data.user?.email ?? "Not provided"}</li>
              <li><span className="text-slate-300">Name:</span> {data.user?.firstName ?? ""} {data.user?.lastName ?? ""}</li>
            </ul>
          </div>

          <button
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-rose-300 hover:text-rose-100"
            onClick={() => {
              logout().catch(() => undefined);
            }}
            type="button"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
