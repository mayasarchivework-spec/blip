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
  code?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
  msg?: string;
  message?: string;
}

export class SupabaseAuthError extends Error {
  readonly code?: string;
  readonly status: number;

  constructor({
    code,
    details,
    message,
    status
  }: {
    code?: string;
    details?: string;
    message: string;
    status: number;
  }) {
    super(details ? `${message}\n${details}` : message);
    this.name = "SupabaseAuthError";
    this.code = code;
    this.status = status;
  }
}

export function formatSupabaseAuthError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const rawMessage = error.message.trim();
  const lowerMessage = rawMessage.toLowerCase();

  if (lowerMessage.includes("error sending confirmation email")) {
    const redirectTo = getAuthRedirectTo();
    const redirectHelp = redirectTo
      ? `Also make sure ${redirectTo} is listed in your Supabase Auth redirect URLs.`
      : "Also make sure your production Blip URL is listed in your Supabase Auth redirect URLs.";

    return [
      "Supabase could not send the confirmation email. This usually means the Supabase Auth email sender or SMTP settings need attention.",
      "Check the sender/from email, SMTP host, port, username, password, and provider verification in Supabase Authentication settings.",
      redirectHelp,
      "",
      "Raw Supabase error:",
      rawMessage
    ].join("\n");
  }

  return rawMessage || fallback;
}

function authUrl(path: string) {
  assertSupabaseConfig();
  return new URL(`/auth/v1/${path.replace(/^\/+/, "")}`, supabaseUrl).toString();
}

function siteOrigin() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  return typeof window !== "undefined" ? window.location.origin : "";
}

export function getAuthRedirectTo() {
  const origin = siteOrigin();

  if (!origin) {
    return undefined;
  }

  try {
    return new URL("/home", origin).toString();
  } catch {
    return undefined;
  }
}

async function buildAuthError(response: Response) {
  const bodyText = await response.text();
  let parsed: AuthErrorResponse = {};

  if (bodyText) {
    try {
      parsed = JSON.parse(bodyText) as AuthErrorResponse;
    } catch {
      parsed = {};
    }
  }

  const message =
    (parsed.error_description ??
      parsed.message ??
      parsed.msg ??
      parsed.error ??
      bodyText.trim()) ||
    `Supabase Auth request failed: ${response.status}`;
  const code = parsed.code ?? parsed.error_code ?? parsed.error;
  const detailParts = [
    `Supabase status: ${response.status}`,
    code ? `Supabase code: ${code}` : "",
    parsed.error && parsed.error !== message ? `Supabase error: ${parsed.error}` : ""
  ].filter(Boolean);

  return new SupabaseAuthError({
    code,
    details: detailParts.join("\n"),
    message,
    status: response.status
  });
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
    throw await buildAuthError(response);
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
  const redirectTo = getAuthRedirectTo();
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

export async function requestEmailChange(email: string, accessToken: string) {
  const redirectTo = getAuthRedirectTo();

  return authFetch<SupabaseAuthUser>(
    redirectTo ? `user?redirect_to=${encodeURIComponent(redirectTo)}` : "user",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ email })
    }
  );
}

export async function signOutSession(accessToken: string) {
  await authFetch("logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}
