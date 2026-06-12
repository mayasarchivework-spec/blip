export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const ownerEmails = toList(process.env.NEXT_PUBLIC_BLIP_OWNER_EMAILS);
const ownerUsernames = toList(process.env.NEXT_PUBLIC_BLIP_OWNER_USERNAMES);
const adminEmails = toList(process.env.NEXT_PUBLIC_BLIP_ADMIN_EMAILS);
const adminUsernames = toList(process.env.NEXT_PUBLIC_BLIP_ADMIN_USERNAMES);

export function assertSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }
}

export function getConfiguredAccountRole(email?: string, username?: string) {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const normalizedUsername = username?.trim().toLowerCase() ?? "";

  if (
    ownerEmails.includes(normalizedEmail) ||
    ownerUsernames.includes(normalizedUsername)
  ) {
    return "owner" as const;
  }

  if (
    adminEmails.includes(normalizedEmail) ||
    adminUsernames.includes(normalizedUsername)
  ) {
    return "admin" as const;
  }

  return "user" as const;
}

function toList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}
