"use client";

import { verifyPassword, verifyUsername } from "@/utils/inputValidation/userValidation";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
} from "react";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "localhost:3000";
const baseUrl = `http://${rawBaseUrl.replace(/\/+$/, "")}`;

export type UserSessionState =
    | { isAuthenticated: false; username: null; id: null; role: null; avatarUrl: null }
    | { isAuthenticated: true; username: string; id: string; role: "ADMIN" | "USER"; avatarUrl: string | null };

const initialState: UserSessionState = {
    isAuthenticated: false,
    username: null,
    avatarUrl: null,
    id: null,
    role: null,
}

interface UserSessionContextValue {
    session: UserSessionState;
    baseUrl: string;
    login: (credentials: { username: string; password: string }) => Promise<Response>;
    logout: () => Promise<void>;
    authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

type SessionAction = { type: "LOGOUT" } | { type: "LOGIN"; payload: { id: string; username: string; avatarUrl: string; role: "ADMIN" | "USER" } };

function sessionReducer(state: UserSessionState, action: SessionAction): UserSessionState {
    switch (action.type) {
        case "LOGIN":
            return { isAuthenticated: true, ...action.payload };
        case "LOGOUT":
            return initialState;
    }
}

/// --------------------------- Context and Provider
const UserSessionContext = createContext<UserSessionContextValue | undefined>(undefined);

export function UserSessionProvider({ children }: { children: React.ReactNode }) {
    const refreshPromiseRef = useRef<Promise<Response> | null>(null); // Ref to prevent multiple simultaneous refreshes
    const [session, dispatch] = useReducer(sessionReducer, initialState);
    const isAuthenticatedRef = useRef(false);

    // ------------------- Token Refresh Logic. Note: only refreshes token, does not update session
    const doRefresh = useCallback(async (): Promise<Response> => {
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
                dispatch({ type: "LOGOUT" });
            }
            return response;
        } catch (error) {
            dispatch({ type: "LOGOUT" });
            throw error;
        }
    }, []);

    const refreshAccessToken = useCallback(async (): Promise<Response> => {
        if (!refreshPromiseRef.current) {
            refreshPromiseRef.current = doRefresh().finally(() => {
                refreshPromiseRef.current = null;
            });
        }
        return refreshPromiseRef.current;
    }, [doRefresh]);

    // ---------------- Auth Fetch Wrapper (autocalls refresh on 401 and retries original request)
    const authFetch = useCallback(
        async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            try {
                if (!isAuthenticatedRef.current) {
                    return Response.json({ error: "Not authenticated" }, { status: 401 });
                }
                const headers = new Headers(init?.headers);
                const requestInit: RequestInit = {
                    ...init,
                    headers,
                    credentials: "include",
                };
                const signal = init?.signal;

                const response = await fetch(input, requestInit);

                // Request failed, potentially need to refresh token
                if (isAuthenticatedRef.current && response.status === 401 && !signal?.aborted) {

                    const refreshResponse = await refreshAccessToken();

                    if (isAuthenticatedRef.current && refreshResponse?.ok && !signal?.aborted) {
                        // Refresh succeeded, re-attempt request
                        const secondResponse = await fetch(input, requestInit);

                        return secondResponse;
                    } else {
                        // Refresh failed, return original response
                        // Note: since refresh failed, refreshAccessToken has updated session state
                        return response;
                    }
                } else {
                    // Request succeeded
                    return response;
                }
            } catch (error) {
                return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 600 });
            }
        },
        [isAuthenticatedRef, refreshAccessToken],
    );

    // ------------------- Login and Logout
    const logout = useCallback(
        async () => {
            try {
                // Logging out requires accessToken and thus potentially a refresh
                await authFetch(`${baseUrl}/api/users/logout`);

            } finally {
                dispatch({ type: "LOGOUT" });
            }
        }, [authFetch]);

    const login = useCallback(
        async ({ username, password }: { username: string; password: string }) => {
            let error = null;
            error = verifyUsername(username);
            if (error) {
                return Response.json({ error }, { status: 400 });
            }
            error = verifyPassword(password);
            if (error) {
                return Response.json({ error }, { status: 400 });
            }

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
                    throw new Error("Login Failed");
                }

                const { id, avatarUrl, role } = await response.json();
                if (!id || !role) {
                    throw new Error("Login Failed");
                }

                dispatch({
                    type: "LOGIN",
                    payload: {
                        id: id,
                        username: username,
                        avatarUrl: avatarUrl ?? null,
                        role: role,
                    }
                });

                return response;

            } catch (error) {
                dispatch({ type: "LOGOUT" });
                throw error;
            }
        }, [logout]);

    // --------------------------- States and Callbacks finished

    const contextValue = useMemo(
        () => ({
            session,
            baseUrl,
            login,
            logout,
            authFetch,
        }),
        [session, login, logout, authFetch],
    );

    useEffect(() => { // Attempt to refresh on initial load to populate session if possible
        let isActive = true;
        refreshAccessToken().then(async (response) => {
            if (!response.ok || !isActive) {
                return;
            }
            const body = await response.json();
            dispatch({
                type: "LOGIN",
                payload: {
                    id: body.id,
                    username: body.username,
                    avatarUrl: body.avatarUrl ?? null,
                    role: body.role,
                }
            });

        });
        return () => { isActive = false; }
    }, [refreshAccessToken]);

    useEffect(() => { // Keep ref updated to prevent multiple simultaneous refresh attempts
        isAuthenticatedRef.current = session.isAuthenticated;
    }, [session.isAuthenticated]);

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
