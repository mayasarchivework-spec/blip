import { assertSupabaseConfig, supabaseKey, supabaseUrl } from "@/lib/supabase/config";

type ProfileImageKind = "avatar" | "banner";

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function dataUrlToBlob(dataUrl: string) {
  const [metadata, payload] = dataUrl.split(",");
  const mimeType = metadata?.match(/^data:([^;]+);base64$/)?.[1] ?? "image/jpeg";
  const binary = atob(payload ?? "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return {
    blob: new Blob([bytes], { type: mimeType }),
    mimeType
  };
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export function publicStorageUrl(bucket: string, path: string) {
  assertSupabaseConfig();

  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${encodeStoragePath(path)}`;
}

export async function uploadProfileImage({
  accessToken,
  dataUrl,
  kind,
  userId
}: {
  accessToken?: string | null;
  dataUrl: string;
  kind: ProfileImageKind;
  userId: string;
}) {
  assertSupabaseConfig();

  const { blob, mimeType } = dataUrlToBlob(dataUrl);
  const bucket = kind === "banner" ? "profile-banners" : "avatars";
  const path = `${userId}/${kind}-${Date.now()}.${extensionForMimeType(mimeType)}`;
  const response = await fetch(
    `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/${bucket}/${encodeStoragePath(path)}`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken || supabaseKey}`,
        "Content-Type": mimeType,
        "x-upsert": "false"
      },
      body: blob
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase storage upload failed: ${response.status}`);
  }

  return publicStorageUrl(bucket, path);
}
