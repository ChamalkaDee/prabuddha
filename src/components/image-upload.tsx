"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

export const MAX_IMAGES = 4;
const MAX_EDGE = 1400;
/** Each photo is re-encoded until it fits this, so four always fit the 4MB request limit. */
const TARGET_BYTES = 800 * 1024;

/**
 * Decodes a photo, honouring the camera's EXIF rotation. Older iPadOS
 * versions reject some files in createImageBitmap, so fall back to <img>.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Resizes a photo in the browser before it ever reaches the server.
 * A modern phone photo is 3-5MB; the server accepts 4MB per request in
 * total, so four raw photos would fail. This brings each one down to a
 * few hundred KB, which is also plenty for a book cover.
 */
async function shrink(file: File): Promise<File> {
  const image = await decode(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  context.drawImage(image, 0, 0, width, height);
  if ("close" in image) image.close();

  let blob: Blob | null = null;
  for (const quality of [0.82, 0.7, 0.55]) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && blob.size <= TARGET_BYTES) break;
  }
  if (!blob) throw new Error("encode failed");

  const name = (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

export type Picked = { file: File; preview: string };

/**
 * Controlled photo picker. The parent form owns the list and appends the
 * resized files itself when it submits, so the raw camera files in the
 * <input> are never sent.
 */
export function ImageUpload({
  picked,
  onChange,
  onBusyChange,
}: {
  picked: Picked[];
  onChange: (next: Picked[]) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const t = useTranslations("admin");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    // Reset so picking the same photo again still fires a change.
    event.target.value = "";
    if (chosen.length === 0) return;

    setBusy(true);
    onBusyChange(true);
    setError(null);

    const room = MAX_IMAGES - picked.length;
    const results = await Promise.allSettled(chosen.slice(0, room).map(shrink));
    const ready = results
      .filter((r): r is PromiseFulfilledResult<File> => r.status === "fulfilled")
      .map((r) => ({ file: r.value, preview: URL.createObjectURL(r.value) }));

    onChange([...picked, ...ready]);
    if (ready.length < results.length) setError(t("uploadFailed"));
    else if (chosen.length > room) setError(t("tooManyPhotos", { max: MAX_IMAGES }));

    setBusy(false);
    onBusyChange(false);
  }

  function remove(index: number) {
    URL.revokeObjectURL(picked[index].preview);
    onChange(picked.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
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
                className="h-24 w-[68px] rounded-[10px] border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={t("removeImage")}
                className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-foreground"
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
