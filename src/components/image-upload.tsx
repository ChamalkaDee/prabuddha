"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

const MAX_IMAGES = 4;
const MAX_EDGE = 1400;
const QUALITY = 0.85;

/**
 * Resizes a photo in the browser before it ever reaches the server.
 * A modern phone photo is 3-5MB; Vercel caps a server action body at
 * roughly 4.5MB, so four raw photos would fail. This brings each one
 * down to a few hundred KB, which is also plenty for a book cover.
 */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

type Picked = { file: File; preview: string };

export function ImageUpload() {
  const t = useTranslations("admin");
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Keeps the real <input type="file"> in sync so the form posts these files. */
  function syncInput(next: Picked[]) {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    next.forEach((item) => transfer.items.add(item.file));
    inputRef.current.files = transfer.files;
  }

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    if (chosen.length === 0) return;

    setBusy(true);
    setError(null);
    try {
      const room = MAX_IMAGES - picked.length;
      const shrunk = await Promise.all(chosen.slice(0, room).map(shrink));
      const next = [
        ...picked,
        ...shrunk.map((file) => ({ file, preview: URL.createObjectURL(file) })),
      ];
      setPicked(next);
      syncInput(next);
    } catch {
      setError(t("uploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  function remove(index: number) {
    URL.revokeObjectURL(picked[index].preview);
    const next = picked.filter((_, i) => i !== index);
    setPicked(next);
    syncInput(next);
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        name="images"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        className="hidden"
        onChange={onPick}
      />

      {picked.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {picked.map((item, index) => (
            <li key={item.preview} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview}
                alt=""
                className="h-24 w-[68px] rounded-xl border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={t("removeImage")}
                className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-high text-muted transition-colors hover:text-foreground"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {index === 0 && (
                <span className="mt-1.5 block text-center text-[10px] text-accent">
                  {t("coverImage")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {picked.length < MAX_IMAGES && (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-border px-6 text-sm text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {busy ? (
            t("preparingImages")
          ) : (
            <>
              <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 5v14M5 12h14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              {picked.length === 0 ? t("choosePhotos") : t("addAnotherPhoto")}
            </>
          )}
        </button>
      )}

      <p className="text-[11px] leading-relaxed text-muted">
        {t("photoHint", { max: MAX_IMAGES })}
      </p>

      {error && <p className="text-[11px] text-alert">{error}</p>}
    </div>
  );
}
