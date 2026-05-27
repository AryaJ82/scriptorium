"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "localhost:3000";
const baseUrl = `http://${rawBaseUrl.replace(/\/+$/, "")}`;

export interface UserSessionState {
    isAuthenticated: boolean;
    username: string | null;
    avatarUrl: string | null;
    userId: string | null;
    role: string | null;
}

interface UserSessionContextValue {
    session: UserSessionState;
    baseUrl: string;
    login: (credentials: { username: string; password: string }) => Promise<Response | null>;
    logout: () => Promise<void>;
    authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response | null>;
}

const UserSessionContext = createContext<UserSessionContextValue | undefined>(undefined);

export function UserSessionProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<UserSessionState>({
        isAuthenticated: false,
        username: null,
        avatarUrl: null,
        userId: null,
        role: null,
    });

    const resetSession = () => {
        setSession({
            isAuthenticated: false,
            username: null,
            avatarUrl: null,
            userId: null,
            role: null,
        });
    }

    const refreshAccessToken = useCallback(
        async () => {
            try {
                const response = await fetch(`${baseUrl}/api/users/refresh`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                });

                // Refresh failed, reset session
                if (!response.ok) {
                    resetSession()
                }
                return response;

            } catch (error) {
                resetSession()
            }

            return null;
        }, []);

    const authFetch = useCallback(
        async (input: RequestInfo | URL, init?: RequestInit) => {
            try {
                const headers = new Headers(init?.headers);

                const requestInit: RequestInit = {
                    ...init,
                    headers,
                    credentials: "include",
                };

                const response = await fetch(input, requestInit);


                // Request failed, potentially need to refresh token
                if (session.isAuthenticated && response.status === 401) {

                    const refreshResponse = await refreshAccessToken();

                    if (refreshResponse?.ok) {
                        // Refresh succeeded, re-attempt request
                        return await fetch(input, requestInit);
                    } else {
                        // Refresh failed, return original response
                        // Note: since refresh failed, refreshAccessToken has updated session state
                        return response;
                    }
                }
                return response;

            } catch (error) {
                console.error("Failed authFetch:", error);
                return null;
            }

        },
        [session],
    );

    const login = useCallback(
        async ({ username, password }: { username: string; password: string }) => {

            try {
                await logout();

                const response = await fetch(`${baseUrl}/api/users/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (!response.ok) {
                    return response;
                }

                const { id, avatarUrl, role } = await response.json();
                if (!id) {
                    throw new Error("Login Failed");
                }

                setSession({
                    isAuthenticated: true,
                    userId: id,
                    username: username,
                    avatarUrl: avatarUrl ?? "",
                    role: role ?? "USER",
                });

                return response;

            } catch (error) {
                console.error(error);
                resetSession();
                return null;
            }
        }, []);

    const logout = useCallback(
        async () => {
            try {
                if (!session.isAuthenticated) {
                    return;
                }

                await fetch(`${baseUrl}/api/users/logout`, {
                    method: "GET",
                    credentials: "include",
                });
            } finally {
                resetSession();
            }
        }, [session]);

    const contextValue = useMemo(
        () => ({
            session,
            baseUrl,
            login,
            logout,
            authFetch,
        }),
        [session, authFetch, login, logout],
    );

    return (
        <UserSessionContext.Provider value={contextValue}>
            {children}
        </UserSessionContext.Provider>
    );
}

export function useUserSession() {
    const context = useContext(UserSessionContext);

    if (!context) {
        throw new Error("useUserSession must be used within a UserSessionProvider");
    }

    return context;
}
