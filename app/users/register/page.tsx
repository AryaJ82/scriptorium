"use client";


import { ArrowRight, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { useUserSession } from "@/contexts/UserSessionContext";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/Label";
import { ScriptoriumLogo } from "@/components/ScriptoriumLogo";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { verifyPassword, verifyUsername } from "@/utils/inputValidation/userValidation";


export default function RegisterPage() {
    const router = useRouter();
    const { login, baseUrl } = useUserSession();
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = useCallback(async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

        let error = null;
        error = verifyUsername(username);
        if (error) {
            setIsLoading(false);
            return toast.error(error.message ?? "Invalid username");
        }
        error = verifyPassword(password);
        if (error) {
            setIsLoading(false);
            return toast.error(error.message ?? "Invalid password");
        }

        fetch(`${baseUrl}/api/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: username.trim(), password }),
        }).then(async (result) => {
            if (result?.ok) {
                return login({ username: username.trim(), password })
            } else {
                const { error } = await result?.json();
                toast.error(error.message ?? "Login Failed");
            }
        }).then(async (result) => {
            // login successful, redirect to home page
            if (result?.ok) {
                router.push("/");
            } else {
                const { error } = await result?.json();
                toast.error(error?.message ?? "Something went wrong. Please login manually.");
            }
        }).catch((submitError) => {
            toast.error(
                submitError instanceof Error
                    ? submitError.message
                    : "Something went wrong.",
            );
        }).finally(() => {
            setIsLoading(false);
        });
    }, [baseUrl, username, password, login, router]);


    return (
        <main className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_38%),linear-gradient(135deg,var(--background),color-mix(in srgb,var(--background)_80%,var(--accent)))] px-4 py-12">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative w-full max-w-md rounded-[1.75rem] border border-border/70 bg-card/80 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <div className={"w-full"}>
                    <div className="mb-8 flex flex-col gap-4">
                        <div className="flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                            <Sparkles className="size-3.5" />
                            Welcome back
                        </div>
                        <div className="flex items-center gap-3">
                            <ScriptoriumLogo className="text-foreground" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Register a new account</h1>
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
                            {isLoading ? "Creating account..." : "Create Account"}
                            {!isLoading && <ArrowRight className="size-4" />}
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}