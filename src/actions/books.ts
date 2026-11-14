"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/access";
import { locales } from "@/i18n/routing";
import { StorageNotConfiguredError, uploadBookCover } from "@/lib/storage";
import { Prisma } from "@/generated/prisma/client";
import { BANNER_COLORS, BANNER_MAX_LENGTH, DEFAULT_BANNER_COLOR } from "@/lib/banner";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export type CreateBookResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string; field?: string };

/** Total request budget; matches serverActions.bodySizeLimit in next.config. */
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

/** Postgres/pooler failures where the right advice is "wait and retry". */
function isConnectionError(cause: unknown) {
  if (cause instanceof Prisma.PrismaClientInitializationError) return true;
  const code =
    cause instanceof Prisma.PrismaClientKnownRequestError ? cause.code : null;
  if (code && ["P1001", "P1002", "P1008", "P1017", "P2024"].includes(code)) {
    return true;
  }
  const message = cause instanceof Error ? cause.message : String(cause);
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|timed? ?out|terminat|too many (clients|connections)/i.test(
    message,
  );
}

/**
 * Returns a result rather than throwing or redirecting on failure, so the
 * form can show a specific message and keep everything the admin typed.
 * An uncaught error here is what produced the bare "This page couldn't
 * load" screen on phones.
 */
export async function createBook(formData: FormData): Promise<CreateBookResult> {
  return saveBook(null, formData);
}

/** Same form and rules as createBook, applied to an existing book. */
export async function updateBook(
  bookId: string,
  formData: FormData,
): Promise<CreateBookResult> {
  return saveBook(bookId, formData);
}

async function saveBook(
  bookId: string | null,
  formData: FormData,
): Promise<CreateBookResult> {
  await requireAdmin();
  const [e, locale] = await Promise.all([getTranslations("errors"), getLocale()]);
  const action = bookId ? "updateBook" : "createBook";

  const shelfMark = str(formData, "shelfMark");
  const author = str(formData, "author");

  // At least one language must have a title, or the book is unlistable.
  const translations = locales
    .map((code) => ({
      locale: code,
      title: str(formData, `title_${code}`),
      description: str(formData, `description_${code}`),
      authorBio: str(formData, `authorBio_${code}`),
    }))
    .filter((tr): tr is typeof tr & { title: string } => Boolean(tr.title));

  if (!shelfMark) return { ok: false, field: "shelfMark", message: e("missingShelfMark") };
  if (!author) return { ok: false, field: "author", message: e("missingAuthor") };
  if (translations.length === 0) {
    return { ok: false, field: `title_${locale}`, message: e("missingTitle") };
  }

  const pageCountRaw = str(formData, "pageCount");
  const pageCount = pageCountRaw ? Number(pageCountRaw) : null;
  if (pageCount !== null && (!Number.isInteger(pageCount) || pageCount < 1)) {
    return { ok: false, field: "pageCount", message: e("pageCountInvalid") };
  }

  const copiesRaw = str(formData, "copies");
  const copies = copiesRaw ? Number(copiesRaw) : 1;
  if (!Number.isInteger(copies) || copies < 1 || copies > 999) {
    return { ok: false, field: "copies", message: e("copiesInvalid") };
  }

  const bannerText = str(formData, "bannerText")?.slice(0, BANNER_MAX_LENGTH) ?? null;
  const bannerColorRaw = str(formData, "bannerColor");
  const bannerColor =
    bannerColorRaw && bannerColorRaw in BANNER_COLORS ? bannerColorRaw : DEFAULT_BANNER_COLOR;

  // Checked before uploading so a clash does not leave orphaned photos.
  try {
    if (bookId) {
      const existing = await prisma.book.findUnique({
        where: { id: bookId },
        select: { id: true },
      });
      if (!existing) return { ok: false, message: e("bookNotFound") };
    }
    const clash = await prisma.book.findUnique({
      where: { shelfMark },
      select: { id: true },
    });
    if (clash && clash.id !== bookId) {
      return { ok: false, field: "shelfMark", message: e("shelfMarkTaken", { mark: shelfMark }) };
    }
  } catch (cause) {
    console.error(`${action}: lookup failed`, cause);
    return { ok: false, message: e("databaseUnavailable") };
  }

  // Photos already on the book that the admin kept, in their order.
  const keptUrls = formData
    .getAll("keepImage")
    .map((v) => String(v).trim())
    .filter((url) => /^https?:\/\//i.test(url));

  // Then new uploads, then any pasted URLs, capped at four in total.
  const uploads = formData
    .getAll("images")
    .filter((v): v is File => v instanceof File && v.size > 0)
    .slice(0, Math.max(0, 4 - keptUrls.length));

  const totalBytes = uploads.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return {
      ok: false,
      message: e("photosTooLarge", { size: (totalBytes / 1024 / 1024).toFixed(1) }),
    };
  }

  let uploadedUrls: string[];
  try {
    // In parallel: on a phone connection each upload is a separate wait.
    uploadedUrls = await Promise.all(
      uploads.map((file, index) => uploadBookCover(file, shelfMark, index)),
    );
  } catch (cause) {
    console.error(`${action}: photo upload failed`, cause);
    if (cause instanceof StorageNotConfiguredError) {
      return { ok: false, message: e("storageNotConfigured") };
    }
    const reason = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, message: e("photoUploadFailed", { reason }) };
  }

  const pastedUrls = formData
    .getAll("imageUrl")
    .map((v) => String(v).trim())
    .filter((url) => /^https?:\/\//i.test(url));

  const imageUrls = [...keptUrls, ...uploadedUrls, ...pastedUrls].slice(0, 4);
  const images = imageUrls.map((url, position) => ({ url, position }));

  const fields = {
    shelfMark,
    author,
    pageCount,
    showDescription: formData.get("showDescription") === "on",
    showPageCount: formData.get("showPageCount") === "on",
    showAuthorBio: formData.get("showAuthorBio") === "on",
    visible: formData.get("visible") === "on",
    pinned: formData.get("pinned") === "on",
    copies,
    bannerText,
    bannerColor: bannerText ? bannerColor : null,
  };

  try {
    if (bookId) {
      await prisma.book.update({
        where: { id: bookId },
        data: {
          ...fields,
          translations: {
            // A language whose title was cleared is removed entirely.
            deleteMany: { locale: { notIn: translations.map((tr) => tr.locale) } },
            upsert: translations.map(({ locale: code, ...text }) => ({
              where: { bookId_locale: { bookId, locale: code } },
              create: { locale: code, ...text },
              update: text,
            })),
          },
          images: { deleteMany: {}, create: images },
        },
      });
    } else {
      await prisma.book.create({
        data: {
          ...fields,
          language: str(formData, "language") ?? "si",
          translations: { create: translations },
          images: { create: images },
        },
      });
    }
  } catch (cause) {
    if (
      cause instanceof Prisma.PrismaClientKnownRequestError &&
      cause.code === "P2002"
    ) {
      return { ok: false, field: "shelfMark", message: e("shelfMarkTaken", { mark: shelfMark }) };
    }
    const reference = crypto.randomUUID().slice(0, 8);
    console.error(`${action}: save failed [ref ${reference}]`, cause);
    if (isConnectionError(cause)) {
      return { ok: false, message: e("databaseUnavailable") };
    }
    return { ok: false, message: e("saveFailed", { reference }) };
  }

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: `/${locale}/admin/inventory` };
}

export async function toggleVisibility(bookId: string) {
  await requireAdmin();
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return;
  await prisma.book.update({
    where: { id: bookId },
    data: { visible: !book.visible },
  });
  revalidatePath("/", "layout");
}

export async function togglePin(bookId: string) {
  await requireAdmin();
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { pinned: true },
  });
  if (!book) return;
  await prisma.book.update({
    where: { id: bookId },
    data: { pinned: !book.pinned },
  });
  revalidatePath("/", "layout");
}

export async function deleteBook(bookId: string) {
  await requireAdmin();
  const active = await prisma.loan.count({
    where: { bookId, status: "ACTIVE" },
  });
  if (active > 0) return;
  await prisma.book.delete({ where: { id: bookId } });
  revalidatePath("/", "layout");
}
