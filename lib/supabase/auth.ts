import { assertSupabaseConfig, supabaseKey, supabaseUrl } from "@/lib/supabase/config";

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export interface SupabaseAuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: SupabaseAuthUser;
}

interface AuthResponse extends Omit<SupabaseAuthSession, "expires_at"> {
  expires_at?: number;
}

interface AuthErrorResponse {
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
}

function authUrl(path: string) {
  assertSupabaseConfig();
  return new URL(`/auth/v1/${path.replace(/^\/+/, "")}`, supabaseUrl).toString();
}

function redirectToApp() {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return origin ? `${origin.replace(/\/+$/, "")}/home` : undefined;
}

async function authFetch<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(authUrl(path), {
    ...init,
    headers: {
      apikey: supabaseKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as AuthErrorResponse;
    throw new Error(
      error.error_description ??
        error.message ??
        error.msg ??
        error.error ??
        `Supabase Auth request failed: ${response.status}`
    );
  }

  return (await response.json()) as T;
}

function withExpiry(session: AuthResponse): SupabaseAuthSession {
  return {
    ...session,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in
  };
}

export async function signInWithPassword(email: string, password: string) {
  const session = await authFetch<AuthResponse>("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  return withExpiry(session);
}

export async function signUpWithPassword(
  email: string,
  password: string,
  metadata?: { displayName?: string; username?: string }
) {
  const redirectTo = redirectToApp();
  const response = await authFetch<Partial<AuthResponse> & { user?: SupabaseAuthUser }>(
    redirectTo ? `signup?redirect_to=${encodeURIComponent(redirectTo)}` : "signup",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        data: {
          app_name: "Blip",
          display_name: metadata?.displayName,
          username: metadata?.username
        }
      })
    }
  );

  if (!response.access_token || !response.refresh_token || !response.expires_in || !response.user) {
    throw new Error("Check your email to finish creating your Blip account.");
  }

  return withExpiry(response as AuthResponse);
}

export async function refreshAuthSession(refreshToken: string) {
  const session = await authFetch<AuthResponse>("token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  return withExpiry(session);
}

export async function signOutSession(accessToken: string) {
  await authFetch("logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}
