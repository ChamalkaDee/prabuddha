"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/access";
import {
  PDF_MAX_BYTES,
  StorageNotConfiguredError,
  pdfObjectUrl,
  removePdfObjects,
  signPdfUploads,
  type SignedUpload,
} from "@/lib/storage";

export type PdfResult = { ok: boolean; message: string };

/** Paths are only ever ones signPdfUploads made: "<stamp>-<rand>/<name>". */
const PATH_PATTERN = /^\d+-[a-z0-9]+\/[a-z0-9-_]+\.(pdf|jpg)$/;

function text(value: FormDataEntryValue | null, max: number) {
  const v = String(value ?? "").trim().slice(0, max);
  return v || null;
}

export async function preparePdfUpload(
  fileName: string,
  fileSize: number,
): Promise<
  { ok: true; file: SignedUpload; cover: SignedUpload } | { ok: false; message: string }
> {
  await requireAdmin();
  const e = await getTranslations("errors");
  if (fileSize > PDF_MAX_BYTES) {
    return { ok: false, message: e("pdfTooLarge", { max: PDF_MAX_BYTES / 1024 / 1024 }) };
  }
  try {
    return { ok: true, ...(await signPdfUploads(fileName)) };
  } catch (cause) {
    console.error("[pdfs] could not sign upload", cause);
    if (cause instanceof StorageNotConfiguredError) {
      return { ok: false, message: e("pdfStorageNotConfigured") };
    }
    return { ok: false, message: e("pdfUploadFailed", { reason: String(cause) }) };
  }
}

/** Records a PDF the browser has already uploaded to storage. */
export async function createPdfBook(input: {
  title: string;
  author: string;
  description: string;
  filePath: string;
  coverPath: string | null;
  fileName: string;
  fileSize: number;
  pageCount: number | null;
}): Promise<PdfResult> {
  await requireAdmin();
  const e = await getTranslations("errors");

  const title = input.title.trim().slice(0, 200);
  if (!title) return { ok: false, message: e("pdfTitleMissing") };
  if (!PATH_PATTERN.test(input.filePath)) return { ok: false, message: e("pdfNotUploaded") };

  // Trust only what is actually in the bucket, not what the browser says.
  const fileUrl = await pdfObjectUrl(input.filePath);
  if (!fileUrl) return { ok: false, message: e("pdfNotUploaded") };
  const coverUrl =
    input.coverPath && PATH_PATTERN.test(input.coverPath)
      ? await pdfObjectUrl(input.coverPath)
      : null;

  await prisma.pdfBook.create({
    data: {
      title,
      author: input.author.trim().slice(0, 200) || null,
      description: input.description.trim().slice(0, 4000) || null,
      fileUrl,
      filePath: input.filePath,
      fileName: input.fileName.slice(0, 200) || "document.pdf",
      fileSize: Math.max(0, Math.round(input.fileSize)),
      pageCount:
        input.pageCount && Number.isInteger(input.pageCount) ? input.pageCount : null,
      coverUrl,
      coverPath: coverUrl ? input.coverPath : null,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "✓" };
}

export async function updatePdfBook(id: string, formData: FormData): Promise<PdfResult> {
  await requireAdmin();
  const e = await getTranslations("errors");
  const title = text(formData.get("title"), 200);
  if (!title) return { ok: false, message: e("pdfTitleMissing") };

  await prisma.pdfBook.update({
    where: { id },
    data: {
      title,
      author: text(formData.get("author"), 200),
      description: text(formData.get("description"), 4000),
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "✓" };
}

export async function setPdfVisible(id: string, visible: boolean) {
  await requireAdmin();
  await prisma.pdfBook.update({ where: { id }, data: { visible } });
  revalidatePath("/", "layout");
}

/** Deletes the record and its file and cover from storage. */
export async function deletePdfBook(id: string) {
  await requireAdmin();
  const pdf = await prisma.pdfBook.delete({ where: { id } });
  try {
    await removePdfObjects([pdf.filePath, pdf.coverPath].filter((p): p is string => !!p));
  } catch (cause) {
    // The record is gone either way; an orphaned file only costs storage.
    console.error("[pdfs] could not remove files", cause);
  }
  revalidatePath("/", "layout");
}
