'use client'

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useUserSession } from "@/contexts/UserSessionContext";
import { DisplayAvatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { UserProfileData } from "@/utils/interfaces";

export default function UserProfile() {
    const router = useRouter();
    const { session, baseUrl, authFetch } = useUserSession();

    const [user, setUser] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionError, setActionError] = useState<string | null>(null);
    const [saveLoading, setSaveLoading] = useState<boolean>(false);

    // Local edit state
    const [editing, setEditing] = useState(false);
    const [draftFirstName, setDraftFirstName] = useState("");
    const [draftLastName, setDraftLastName] = useState("");
    const [draftEmail, setDraftEmail] = useState("");
    const [draftAvatarUrl, setDraftAvatarUrl] = useState("");
    const [draftPhone, setDraftPhone] = useState("");

    useEffect(() => {
        // Only allow viewing/editing your own profile in this page
        if (!session.isAuthenticated || !session.id)  {
            router.push("/users/login");
            return;
        }

        const controller = new AbortController();

        authFetch(`${baseUrl}/api/users/${session.id}`, {
            method: 'GET',
            signal: controller.signal,
        })
            .then(async (res) => {
                const body = await res.json();
                if (controller.signal.aborted) return;
                if (!res.ok) throw new Error(body.error ?? 'Failed to load user data');
                setUser(body.data);
            })
            .catch((err) => {
                if (controller.signal.aborted) return;
                setActionError(err instanceof Error ? err.message : 'Failed to load user data');
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [session.id, session.isAuthenticated, authFetch, baseUrl, router]);

    const startEdit = useCallback(() => {
        if (!user) return;
        setDraftFirstName(user.firstName ?? '');
        setDraftLastName(user.lastName ?? '');
        setDraftEmail(user.email ?? '');
        setDraftAvatarUrl(user.avatarUrl ?? '');
        setDraftPhone(user.phoneNumber ?? '');
        setEditing(true);
        setActionError(null);
    }, [user]);

    const cancelEdit = useCallback(() => {
        setEditing(false);
        setActionError(null);
    }, []);

    const saveProfile = useCallback(async () => {
        if (!user) return;
        setActionError(null);
        setSaveLoading(true);

        try {
            const response = await authFetch(`${baseUrl}/api/users/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: draftFirstName || undefined,
                    lastName: draftLastName || undefined,
                    email: draftEmail || undefined,
                    avatarUrl: draftAvatarUrl || undefined,
                    phoneNumber: draftPhone || undefined,
                }),
            });

            const body = await response.json();
            if (!response.ok) throw new Error(body.error ?? 'Unable to save profile.');

            setUser(body.data);
            setEditing(false);
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Unable to save profile.');
        } finally {
            setSaveLoading(false);
        }
    }, [user, draftFirstName, draftLastName, draftEmail, draftAvatarUrl, draftPhone, authFetch, baseUrl]);

    if (loading) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                <div className="mb-6 flex items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="h-6 w-56 rounded-md bg-muted" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">{actionError ?? 'User not found.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <DisplayAvatar user={user} size="lg"/>
                    <div>
                        <h1 className="text-xl font-semibold">{user.username}</h1>
                        <p className="text-sm text-muted-foreground">{user.role ?? 'User'}</p>
                    </div>
                </div>

                <div>
                    {!editing ? (
                        <Button variant="edit" onClick={startEdit}>Edit Profile</Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={cancelEdit} disabled={saveLoading}>Cancel</Button>
                            <Button variant="outline" onClick={saveProfile} disabled={saveLoading}>{saveLoading ? 'Saving…' : 'Save'}</Button>
                        </div>
                    )}
                </div>
            </div>

            {actionError && (
                <div className="rounded-lg border border-border bg-card p-4 mb-4">
                    <p className="text-sm text-destructive">{actionError}</p>
                </div>
            )}

            <div className="rounded-lg border border-border bg-card p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="text-xs text-muted-foreground">First name</label>
                        <Input value={editing ? draftFirstName : (user.firstName ?? '')} onChange={(e) => setDraftFirstName(e.target.value)} disabled={!editing} />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Last name</label>
                        <Input value={editing ? draftLastName : (user.lastName ?? '')} onChange={(e) => setDraftLastName(e.target.value)} disabled={!editing} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground">Email</label>
                        <Input value={editing ? draftEmail : (user.email ?? '')} onChange={(e) => setDraftEmail(e.target.value)} disabled={!editing} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground">Avatar URL</label>
                        <Input value={editing ? draftAvatarUrl : (user.avatarUrl ?? '')} onChange={(e) => setDraftAvatarUrl(e.target.value)} disabled={!editing} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs text-muted-foreground">Phone</label>
                        <Input value={editing ? draftPhone : (user.phoneNumber ?? '')} onChange={(e) => setDraftPhone(e.target.value)} disabled={!editing} />
                    </div>
                </div>
            </div>
        </div>
    );
}