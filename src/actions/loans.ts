"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { canBorrow, getViewer, requireAdmin } from "@/lib/access";
import {
  EXTENSION_DAYS,
  MAX_ACTIVE_LOANS,
  MAX_EXTENSIONS,
  addDays,
  canExtend,
  dueDateFrom,
} from "@/lib/loans";
import { sendLoanConfirmation } from "@/lib/email";
import { pickTranslation } from "@/lib/book-i18n";
import type { Locale } from "@/i18n/routing";

export type ActionResult = { ok: boolean; message: string };

export async function borrowBook(bookId: string): Promise<ActionResult> {
  const [viewer, e, b, locale] = await Promise.all([
    getViewer(),
    getTranslations("errors"),
    getTranslations("book"),
    getLocale(),
  ]);

  if (!viewer) return { ok: false, message: e("signInFirst") };
  if (!canBorrow(viewer)) return { ok: false, message: e("notApproved") };

  const activeCount = await prisma.loan.count({
    where: { userId: viewer.id, status: "ACTIVE" },
  });
  if (activeCount >= MAX_ACTIVE_LOANS) {
    return { ok: false, message: e("tooManyLoans", { max: MAX_ACTIVE_LOANS }) };
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      translations: true,
      loans: { where: { status: "ACTIVE" }, take: 1 },
    },
  });
  if (!book || !book.visible) return { ok: false, message: e("bookNotFound") };
  if (book.loans.length > 0) return { ok: false, message: e("alreadyOnLoan") };

  const dueAt = dueDateFrom();
  await prisma.loan.create({ data: { bookId, userId: viewer.id, dueAt } });

  // The email goes in the member's own language, not the browsing language.
  const readerLocale = (viewer.locale ?? locale) as Locale;
  await sendLoanConfirmation({
    to: viewer.email,
    locale: readerLocale,
    bookTitle:
      pickTranslation(book.translations, readerLocale).value?.title ??
      book.shelfMark,
    author: book.author,
    dueAt,
  });

  revalidatePath("/", "layout");
  return { ok: true, message: b("reserved") };
}

export async function extendLoan(loanId: string): Promise<ActionResult> {
  const [viewer, e, l] = await Promise.all([
    getViewer(),
    getTranslations("errors"),
    getTranslations("loans"),
  ]);
  if (!viewer) return { ok: false, message: e("signInFirst") };

  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan || loan.userId !== viewer.id) {
    return { ok: false, message: e("loanNotFound") };
  }
  if (loan.extensionCount >= MAX_EXTENSIONS) {
    return { ok: false, message: e("extendUsed") };
  }
  if (!canExtend(loan)) return { ok: false, message: e("extendWindow") };

  await prisma.loan.update({
    where: { id: loanId },
    data: {
      dueAt: addDays(loan.dueAt, EXTENSION_DAYS),
      extensionCount: { increment: 1 },
      extendedAt: new Date(),
    },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: l("extended") };
}

export async function markReturned(loanId: string): Promise<ActionResult> {
  await requireAdmin();
  const e = await getTranslations("errors");

  const loan = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!loan) return { ok: false, message: e("loanNotFound") };

  await prisma.loan.update({
    where: { id: loanId },
    data: { status: "RETURNED", returnedAt: new Date() },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "✓" };
}
