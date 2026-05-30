"use client";

import { useState } from "react";
import { useUserSession } from "@/contexts/UserSessionContext";

export interface LoginFormProps {
    className?: string;
    title?: string;
    subtitle?: string;
    submitLabel?: string;
    onSuccess?: () => void;
}

export function LoginForm({
    className = "",
    title = "Sign in to Scriptorium",
    subtitle = "Use your username and password to access your account.",
    submitLabel = "Log in",
    onSuccess,
}: LoginFormProps) {
    const { login } = useUserSession();
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

        setFormError(null);

        if (!username.trim() || !password) {
            setFormError("Please enter both your username and password.");
            return;
        }

        try {
            const result = await login({ username: username.trim(), password });
            setIsLoading(false)
            if (result?.ok) {
                await onSuccess?.();
            } else {
                const { error } = await result?.json();
                setFormError(error ?? "Login Failed")
            }
        } catch (submitError) {
            setFormError(
                submitError instanceof Error
                    ? submitError.message
                    : "Unable to sign in right now. Please try again.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const showError = formError;

    return (
        <div className={`w-full ${className}`}>
            <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                    Welcome back
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-slate-100">
                    <span className="mb-2 block">Username</span>
                    <input
                        autoComplete="username"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                        name="username"
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="Enter your username"
                        type="text"
                        value={username}
                    />
                </label>

                <label className="block text-sm font-medium text-slate-100">
                    <span className="mb-2 block">Password</span>
                    <input
                        autoComplete="current-password"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                        name="password"
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        type="password"
                        value={password}
                    />
                </label>

                {showError ? (
                    <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        {showError}
                    </p>
                ) : null}

                <button
                    className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-300/70"
                    disabled={isLoading}
                    type="submit"
                >
                    {isLoading ? "Signing in..." : submitLabel}
                </button>
            </form>
        </div>
    );
}
