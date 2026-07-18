"use client";

import { ArrowRight, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { useUserSession } from "@/contexts/UserSessionContext";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/Label";
import { ScriptoriumLogo } from "@/components/ScriptoriumLogo";
import { toast } from "sonner";

export interface LoginFormProps {
    className?: string;
    title?: string;
    subtitle?: string;
    submitLabel?: string;
    onSuccess: () => void;
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

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

        if (!username.trim() || !password) {
            setIsLoading(false);
            toast.error("Please enter both your username and password.");
            return;
        }

        login({ username: username.trim(), password })
            .then(async (result) => {
                if (result?.ok) {
                    onSuccess();
                } else {
                    const { error } = await result?.json();
                    toast.error(error.message ?? "Login Failed");
                }
            })
            .catch((submitError) => {
                toast.error(
                    submitError instanceof Error
                        ? submitError.message
                        : "Unable to sign in right now. Please try again.",
                );
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className={`w-full ${className}`}>
            <div className="mb-8 flex flex-col gap-4">
                <div className="flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                    <Sparkles className="size-3.5" />
                    Welcome back
                </div>
                <div className="flex items-center gap-3">
                    <ScriptoriumLogo className="text-foreground" />
                </div>
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
                </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <Label className="text-sm text-foreground" htmlFor="username">
                        Username
                    </Label>
                    <div className="relative">
                        <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            autoComplete="username"
                            className="h-11 rounded-xl border-border/70 bg-background/70 pl-10 text-foreground shadow-sm"
                            id="username"
                            name="username"
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Enter your username"
                            type="text"
                            value={username}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm text-foreground" htmlFor="password">
                        Password
                    </Label>
                    <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            autoComplete="current-password"
                            className="h-11 rounded-xl border-border/70 bg-background/70 pl-10 text-foreground shadow-sm"
                            id="password"
                            name="password"
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your password"
                            type="password"
                            value={password}
                        />
                    </div>
                </div>

                <Button className="mt-2 h-11 w-full justify-center rounded-xl" disabled={isLoading} size="lg" type="submit">
                    {isLoading ? "Signing in..." : submitLabel}
                    {!isLoading && <ArrowRight className="size-4" />}
                </Button>
            </form>
        </div>
    );
}
