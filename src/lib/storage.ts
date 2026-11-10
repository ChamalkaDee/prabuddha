import { createClient } from "@supabase/supabase-js";

export const BOOK_COVER_BUCKET = "book-covers";

export class StorageNotConfiguredError extends Error {}

/**
 * Server-only Supabase client. Uses the service role key, which bypasses
 * row-level security — it must never be imported into a client component.
 */
function storageClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new StorageNotConfiguredError(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to upload images.",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads one cover and returns its public URL.
 * Files arrive already resized by the browser, so these limits are a
 * backstop against someone posting to the action directly.
 */
export async function uploadBookCover(
  file: File,
  shelfMark: string,
  index: number,
): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error(`unsupported image type ${file.type || "(unknown)"}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error("image is larger than 5MB");
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const safeMark = shelfMark.replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase();
  const path = `${safeMark}/${Date.now()}-${index}.${extension}`;

  const supabase = storageClient();
  const { error } = await supabase.storage
    .from(BOOK_COVER_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    // "Bucket not found" means the storage bucket was never created, which
    // is a setup problem rather than something a retry will fix.
    if (/bucket not found/i.test(error.message)) {
      throw new StorageNotConfiguredError(error.message);
    }
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BOOK_COVER_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
