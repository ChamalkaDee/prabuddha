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

export const PDF_BUCKET = "pdf-books";
/** Supabase's free plan caps a single upload at 50MB. */
export const PDF_MAX_BYTES = 50 * 1024 * 1024;

/**
 * Creates the public PDF bucket the first time it is needed, so there is no
 * dashboard step to forget.
 */
async function ensurePdfBucket(supabase: ReturnType<typeof storageClient>) {
  const { data } = await supabase.storage.getBucket(PDF_BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(PDF_BUCKET, {
    public: true,
    fileSizeLimit: PDF_MAX_BYTES,
    allowedMimeTypes: ["application/pdf", "image/jpeg"],
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new StorageNotConfiguredError(error.message);
  }
}

export type SignedUpload = { path: string; signedUrl: string };

/**
 * PDFs are too big to pass through a server action (Vercel caps request
 * bodies at 4.5MB), so the browser uploads straight to storage with these
 * one-time URLs. Returns one for the file and one for its cover.
 */
export async function signPdfUploads(
  fileName: string,
): Promise<{ file: SignedUpload; cover: SignedUpload }> {
  const supabase = storageClient();
  await ensurePdfBucket(supabase);

  const base =
    fileName
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "document";
  const folder = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const sign = async (path: string) => {
    const { data, error } = await supabase.storage.from(PDF_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message ?? "could not sign upload");
    return { path, signedUrl: data.signedUrl };
  };

  return {
    file: await sign(`${folder}/${base}.pdf`),
    cover: await sign(`${folder}/cover.jpg`),
  };
}

/** Public URL of an uploaded PDF or cover, or null if nothing is there. */
export async function pdfObjectUrl(path: string): Promise<string | null> {
  const supabase = storageClient();
  const slash = path.lastIndexOf("/");
  const { data } = await supabase.storage
    .from(PDF_BUCKET)
    .list(path.slice(0, slash), { search: path.slice(slash + 1) });
  if (!data?.some((o) => o.name === path.slice(slash + 1))) return null;
  return supabase.storage.from(PDF_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removePdfObjects(paths: string[]) {
  if (paths.length === 0) return;
  await storageClient().storage.from(PDF_BUCKET).remove(paths);
}
