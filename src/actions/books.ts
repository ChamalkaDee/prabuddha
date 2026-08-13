"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/access";
import { locales } from "@/i18n/routing";
import { uploadBookCover } from "@/lib/storage";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function createBook(formData: FormData) {
  await requireAdmin();
  const [e, locale] = await Promise.all([getTranslations("errors"), getLocale()]);

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

  if (!shelfMark || !author || translations.length === 0) {
    redirect(
      `/${locale}/admin/inventory/new?error=${encodeURIComponent(
        e("required", { field: "Shelf mark, author, title" }),
      )}`,
    );
  }

  const pageCountRaw = str(formData, "pageCount");

  // Uploaded photos first, then any pasted URLs, capped at four in total.
  const uploads = formData
    .getAll("images")
    .filter((v): v is File => v instanceof File && v.size > 0)
    .slice(0, 4);

  const uploadedUrls: string[] = [];
  for (const [index, file] of uploads.entries()) {
    try {
      uploadedUrls.push(await uploadBookCover(file, shelfMark, index));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Upload failed";
      redirect(
        `/${locale}/admin/inventory/new?error=${encodeURIComponent(message)}`,
      );
    }
  }

  const pastedUrls = formData
    .getAll("imageUrl")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const imageUrls = [...uploadedUrls, ...pastedUrls].slice(0, 4);

  await prisma.book.create({
    data: {
      shelfMark,
      author,
      pageCount: pageCountRaw ? Number(pageCountRaw) : null,
      language: str(formData, "language") ?? "si",
      showDescription: formData.get("showDescription") === "on",
      showPageCount: formData.get("showPageCount") === "on",
      showAuthorBio: formData.get("showAuthorBio") === "on",
      visible: formData.get("visible") === "on",
      translations: { create: translations },
      images: {
        create: imageUrls.map((url, position) => ({ url, position })),
      },
    },
  });

  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/inventory`);
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

export async function deleteBook(bookId: string) {
  await requireAdmin();
  const active = await prisma.loan.count({
    where: { bookId, status: "ACTIVE" },
  });
  if (active > 0) return;
  await prisma.book.delete({ where: { id: bookId } });
  revalidatePath("/", "layout");
}
