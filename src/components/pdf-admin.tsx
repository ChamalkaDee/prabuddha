"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  createPdfBook,
  deletePdfBook,
  preparePdfUpload,
  setPdfVisible,
  updatePdfBook,
} from "@/actions/pdfs";
import { Input, Label, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { loadPdfJs, pdfAssetOptions } from "@/lib/pdfjs";
import { formatFileSize } from "@/lib/utils";

const COVER_WIDTH = 600;

type Picked = {
  file: File;
  pageCount: number | null;
  cover: Blob | null;
  coverPreview: string | null;
};

/**
 * Opens the chosen PDF in the browser to count its pages, read its title
 * and draw page one as the cover. A file pdf.js cannot open is still
 * accepted; it just has no cover or page count.
 */
async function inspect(file: File): Promise<Picked & { title: string | null }> {
  try {
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
      ...pdfAssetOptions(pdfjs.version),
    }).promise;
    try {
      const meta = await doc.getMetadata().catch(() => null);
      const info = meta?.info as { Title?: unknown } | undefined;
      const title = typeof info?.Title === "string" && info.Title.trim() ? info.Title.trim() : null;

      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: COVER_WIDTH / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const cover = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.82),
      );

      return {
        file,
        title,
        pageCount: doc.numPages,
        cover,
        coverPreview: cover ? URL.createObjectURL(cover) : null,
      };
    } finally {
      void doc.destroy();
    }
  } catch (cause) {
    console.error("[pdf] could not inspect", cause);
    return { file, title: null, pageCount: null, cover: null, coverPreview: null };
  }
}

/** PUT to a signed storage URL, reporting progress (fetch cannot). */
function upload(signedUrl: string, body: Blob, onProgress?: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const form = new FormData();
    form.append("cacheControl", "31536000");
    form.append("", body);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`${xhr.status} ${xhr.responseText.slice(0, 200)}`));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(form);
  });
}

export function NewPdfForm() {
  const t = useTranslations("admin");
  const e = useTranslations("errors");
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [title, setTitle] = useState("");
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type && file.type !== "application/pdf") {
      setMessage({ ok: false, text: e("pdfNotPdf") });
      return;
    }
    setMessage(null);
    setReading(true);
    if (picked?.coverPreview) URL.revokeObjectURL(picked.coverPreview);
    const result = await inspect(file);
    setPicked(result);
    setTitle((current) => current || result.title || file.name.replace(/\.pdf$/i, ""));
    setReading(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!picked) return;
    const form = new FormData(event.currentTarget);
    setMessage(null);
    setProgress(0);

    try {
      const signed = await preparePdfUpload(picked.file.name, picked.file.size);
      if (!signed.ok) {
        setMessage({ ok: false, text: signed.message });
        return;
      }
      await upload(signed.file.signedUrl, picked.file, (f) => setProgress(f * 0.97));
      let coverPath: string | null = null;
      if (picked.cover) {
        // A missing cover is not worth failing the whole upload over.
        coverPath = await upload(signed.cover.signedUrl, picked.cover)
          .then(() => signed.cover.path)
          .catch(() => null);
      }
      setProgress(1);

      const result = await createPdfBook({
        title,
        author: String(form.get("author") ?? ""),
        description: String(form.get("description") ?? ""),
        filePath: signed.file.path,
        coverPath,
        fileName: picked.file.name,
        fileSize: picked.file.size,
        pageCount: picked.pageCount,
      });
      if (!result.ok) {
        setMessage({ ok: false, text: result.message });
        return;
      }

      if (picked.coverPreview) URL.revokeObjectURL(picked.coverPreview);
      setPicked(null);
      setTitle("");
      formRef.current?.reset();
      setMessage({ ok: true, text: t("pdfAdded") });
    } catch (cause) {
      console.error("[pdf] upload failed", cause);
      setMessage({
        ok: false,
        text:
          cause instanceof Error && cause.message === "network"
            ? e("connectionLost")
            : e("pdfUploadFailed", { reason: cause instanceof Error ? cause.message : String(cause) }),
      });
    } finally {
      setProgress(null);
    }
  }

  const busy = reading || progress !== null;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-4 space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onPick}
      />

      {picked ? (
        <div className="flex items-center gap-4">
          {picked.coverPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={picked.coverPreview}
              alt=""
              className="h-24 w-[72px] shrink-0 rounded-[8px] border border-border object-cover object-top"
            />
          ) : (
            <span className="flex h-24 w-[72px] shrink-0 items-center justify-center rounded-[8px] border border-border font-mono text-xs text-muted">
              PDF
            </span>
          )}
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{picked.file.name}</p>
            <p className="mt-1 font-mono text-[11px] text-muted">
              {[
                picked.pageCount ? t("pdfPages", { count: picked.pageCount }) : null,
                formatFileSize(picked.file.size),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="mt-1 text-xs text-accent underline disabled:opacity-40"
            >
              {t("pdfChooseAnother")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-border px-6 text-sm text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {reading ? t("pdfReading") : t("pdfChoose")}
        </button>
      )}

      {picked && (
        <>
          <div>
            <Label htmlFor="pdf-title">{t("titleField")}</Label>
            <Input
              id="pdf-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div>
            <Label htmlFor="pdf-author">
              {t("author")} <span className="normal-case opacity-60">· {t("optional")}</span>
            </Label>
            <Input id="pdf-author" name="author" maxLength={200} />
          </div>
          <div>
            <Label htmlFor="pdf-description">
              {t("descriptionField")} <span className="normal-case opacity-60">· {t("optional")}</span>
            </Label>
            <Textarea id="pdf-description" name="description" maxLength={4000} />
          </div>
        </>
      )}

      {progress !== null && (
        <div className="space-y-1.5">
          <span className="block h-1.5 overflow-hidden rounded-full bg-surface-high">
            <span
              className="block h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </span>
          <p className="font-mono text-[11px] text-muted">
            {t("pdfUploading", { percent: Math.round(progress * 100) })}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {picked && (
          <Button type="submit" disabled={busy || !title.trim()}>
            {t("pdfUpload")}
          </Button>
        )}
        {message && (
          <span className={message.ok ? "text-xs text-accent" : "text-xs text-alert"}>
            {message.text}
          </span>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-muted">{t("pdfHint", { max: 50 })}</p>
    </form>
  );
}

export function PdfEditor({
  pdf,
}: {
  pdf: {
    id: string;
    title: string;
    author: string | null;
    description: string | null;
    visible: boolean;
  };
}) {
  const t = useTranslations("admin");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="min-w-0 flex-1 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        start(async () => {
          const result = await updatePdfBook(pdf.id, formData);
          setMessage(result.ok ? t("saved") : result.message);
        });
      }}
    >
      <Input name="title" defaultValue={pdf.title} maxLength={200} aria-label={t("titleField")} />
      <Input
        name="author"
        defaultValue={pdf.author ?? ""}
        maxLength={200}
        placeholder={t("author")}
        aria-label={t("author")}
      />
      <Textarea
        name="description"
        defaultValue={pdf.description ?? ""}
        maxLength={4000}
        placeholder={t("descriptionField")}
        aria-label={t("descriptionField")}
        className="min-h-20"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {t("saveChanges")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => start(async () => void (await setPdfVisible(pdf.id, !pdf.visible)))}
        >
          {pdf.visible ? t("hide") : t("show")}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(t("pdfDeleteConfirm"))) return;
            start(async () => void (await deletePdfBook(pdf.id)));
          }}
        >
          {t("delete")}
        </Button>
        {message && <span className="text-[11px] text-muted">{message}</span>}
      </div>
    </form>
  );
}
