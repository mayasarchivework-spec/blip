import { assertSupabaseConfig, supabaseKey, supabaseUrl } from "@/lib/supabase/config";

type QueryValue = string | number | boolean | null | undefined;

export interface SupabaseFetchOptions extends Omit<RequestInit, "body" | "headers"> {
  accessToken?: string | null;
  body?: unknown;
  headers?: HeadersInit;
  prefer?: string;
  query?: Record<string, QueryValue>;
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  assertSupabaseConfig();

  const url = new URL(`/rest/v1/${path.replace(/^\/+/, "")}`, supabaseUrl);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function supabaseFetch<T>(
  path: string,
  options: SupabaseFetchOptions = {}
): Promise<T> {
  const { accessToken, body, headers, prefer, query, ...init } = options;
  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${accessToken || supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: prefer ?? "return=representation",
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
