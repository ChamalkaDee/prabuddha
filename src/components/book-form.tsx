"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createBook, updateBook, type CreateBookResult } from "@/actions/books";
import { Input, Textarea, Label, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ImageUpload, type Picked } from "@/components/image-upload";
import { locales, localeNames, type Locale } from "@/i18n/routing";

type Failure = Extract<CreateBookResult, { ok: false }>;

/** A saved book, to pre-fill the form when editing. */
export type BookFormValues = {
  id: string;
  shelfMark: string;
  author: string;
  pageCount: number | null;
  showDescription: boolean;
  showPageCount: boolean;
  showAuthorBio: boolean;
  visible: boolean;
  imageUrls: string[];
  translations: Partial<
    Record<Locale, { title: string; description: string | null; authorBio: string | null }>
  >;
};

/**
 * Submits through a handler rather than a plain form action so that a
 * failure — a clash, a dropped connection, a storage problem — comes back
 * as a message above the form with everything still filled in, instead of
 * a full-page error that throws the admin's typing away.
 */
export function BookForm({ book }: { book?: BookFormValues }) {
  const t = useTranslations("admin");
  const e = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();

  const [photos, setPhotos] = useState<Picked[]>([]);
  const [kept, setKept] = useState<string[]>(book?.imageUrls ?? []);
  const [preparing, setPreparing] = useState(false);
  const [pending, start] = useTransition();
  const [failure, setFailure] = useState<Failure | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!failure) return;
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (failure.field) {
      document.getElementById(failure.field)?.focus({ preventScroll: true });
    }
  }, [failure]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (preparing) {
      setFailure({ ok: false, message: e("photosStillPreparing") });
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setFailure({ ok: false, message: e("connectionLost") });
      return;
    }

    const formData = new FormData(event.currentTarget);
    kept.forEach((url) => formData.append("keepImage", url));
    photos.forEach((photo) => formData.append("images", photo.file, photo.file.name));

    setFailure(null);
    start(async () => {
      let result: CreateBookResult;
      try {
        result = book ? await updateBook(book.id, formData) : await createBook(formData);
      } catch {
        // The request itself failed: no signal, or the connection dropped.
        result = { ok: false, message: e("connectionLost") };
      }
      if (result.ok) {
        photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
        router.push(result.redirectTo);
      } else {
        setFailure(result);
      }
    });
  }

  const invalid = (name: string) => (failure?.field === name ? true : undefined);

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-6">
      {failure && (
        <div
          ref={errorRef}
          role="alert"
          className="rounded-2xl border border-alert/30 bg-alert/8 px-5 py-4 text-sm leading-relaxed text-alert"
        >
          {failure.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="shelfMark">{t("shelfMark")}</Label>
          <Input
            id="shelfMark"
            name="shelfMark"
            required
            placeholder="PR-001"
            defaultValue={book?.shelfMark}
            autoCapitalize="characters"
            autoComplete="off"
            aria-invalid={invalid("shelfMark")}
          />
        </div>
        <div>
          <Label htmlFor="pageCount">{t("pageCount")}</Label>
          <Input
            id="pageCount"
            name="pageCount"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            defaultValue={book?.pageCount ?? undefined}
            aria-invalid={invalid("pageCount")}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="author">{t("author")}</Label>
        <Input
          id="author"
          name="author"
          required
          defaultValue={book?.author}
          autoComplete="off"
          aria-invalid={invalid("author")}
        />
      </div>

      <fieldset className="card p-5">
        <legend className="eyebrow px-1">{t("photos")}</legend>
        <div className="mt-4">
          <ImageUpload
            existing={kept}
            onRemoveExisting={(url) => setKept((list) => list.filter((u) => u !== url))}
            picked={photos}
            onChange={setPhotos}
            onBusyChange={setPreparing}
          />
        </div>

        <details className="mt-5">
          <summary className="cursor-pointer text-[11px] text-muted">
            {t("orPasteUrls")}
          </summary>
          <div className="mt-3 space-y-3">
            {[0, 1].map((i) => (
              <Input
                key={i}
                name="imageUrl"
                type="url"
                inputMode="url"
                placeholder={i === 0 ? t("frontCover") : t("optional")}
              />
            ))}
          </div>
        </details>
      </fieldset>

      <div className="card p-5">
        <p className="eyebrow">{t("translationsHint")}</p>
        <div className="mt-5 space-y-7">
          {locales.map((code) => (
            <details
              key={code}
              open={code === locale || Boolean(book?.translations[code])}
              className="group border-t border-border pt-5 first:border-t-0 first:pt-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-accent">
                {localeNames[code]}
                <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor={`title_${code}`}>{t("titleField")}</Label>
                  <Input
                    id={`title_${code}`}
                    name={`title_${code}`}
                    lang={code}
                    defaultValue={book?.translations[code]?.title}
                    aria-invalid={invalid(`title_${code}`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`description_${code}`}>{t("descriptionField")}</Label>
                  <Textarea
                    id={`description_${code}`}
                    name={`description_${code}`}
                    lang={code}
                    defaultValue={book?.translations[code]?.description ?? undefined}
                  />
                </div>
                <div>
                  <Label htmlFor={`authorBio_${code}`}>{t("authorBioField")}</Label>
                  <Textarea
                    id={`authorBio_${code}`}
                    name={`authorBio_${code}`}
                    lang={code}
                    defaultValue={book?.translations[code]?.authorBio ?? undefined}
                  />
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>

      <fieldset className="card p-5">
        <legend className="eyebrow px-1">{t("showOnListing")}</legend>
        <div className="mt-3 space-y-4 text-xs">
          <label className="flex items-center gap-3">
            <Checkbox name="showDescription" defaultChecked={book?.showDescription ?? true} />
            {t("descriptionField")}
          </label>
          <label className="flex items-center gap-3">
            <Checkbox name="showPageCount" defaultChecked={book?.showPageCount ?? true} />
            {t("pageCount")}
          </label>
          <label className="flex items-center gap-3">
            <Checkbox name="showAuthorBio" defaultChecked={book?.showAuthorBio ?? false} />
            {t("authorBioField")}
          </label>
          <label className="flex items-center gap-3">
            <Checkbox name="visible" defaultChecked={book?.visible ?? true} />
            {t("visible")}
          </label>
        </div>
      </fieldset>

      <Button type="submit" className="w-full" disabled={pending || preparing}>
        {pending
          ? photos.length > 0
            ? t("savingWithPhotos", { count: photos.length })
            : t("saving")
          : preparing
            ? t("preparingImages")
            : book
              ? t("saveChanges")
              : t("save")}
      </Button>
    </form>
  );
}
