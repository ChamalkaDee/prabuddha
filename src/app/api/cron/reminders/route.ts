import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReturnReminder } from "@/lib/email";
import { MAX_EXTENSIONS, REMINDER_LEAD_DAYS, addDays } from "@/lib/loans";
import { pickTranslation } from "@/lib/book-i18n";
import { routing, type Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

/** Daily job (see vercel.json). Emails anyone whose book is due in 3 days. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const due = await prisma.loan.findMany({
    where: {
      status: "ACTIVE",
      reminderSentAt: null,
      dueAt: { lte: addDays(new Date(), REMINDER_LEAD_DAYS) },
    },
    include: { book: { include: { translations: true } }, user: true },
  });

  let sent = 0;
  for (const loan of due) {
    if (!loan.user.email) continue;
    const locale = (routing.locales as readonly string[]).includes(
      loan.user.locale,
    )
      ? (loan.user.locale as Locale)
      : routing.defaultLocale;

    await sendReturnReminder({
      to: loan.user.email,
      locale,
      bookTitle:
        pickTranslation(loan.book.translations, locale).value?.title ??
        loan.book.shelfMark,
      dueAt: loan.dueAt,
      canExtend: loan.extensionCount < MAX_EXTENSIONS,
    });
    await prisma.loan.update({
      where: { id: loan.id },
      data: { reminderSentAt: new Date() },
    });
    sent++;
  }

  return NextResponse.json({ checked: due.length, sent });
}
