import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return dateFmt.format(new Date(value));
}

export function daysUntil(value: Date | string) {
  const target = new Date(value).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / 86_400_000);
}

/** "3.2 MB", "840 KB". */
export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Supabase serves a public file as an attachment, under this name, when asked. */
export function downloadUrl(fileUrl: string, fileName: string) {
  return `${fileUrl}?download=${encodeURIComponent(fileName)}`;
}
