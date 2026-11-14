import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { canBorrow, getViewer, isAdmin } from "@/lib/access";
import { Badge } from "@/components/ui/field";
import { BorrowButton } from "@/components/borrow-button";
import { BookCover } from "@/components/book-cover";
import { BookBanner } from "@/components/book-banner";
import { MAX_ACTIVE_LOANS } from "@/lib/loans";
import { pickTranslation } from "@/lib/book-i18n";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const [t, a, format] = await Promise.all([
    getTranslations("book"),
    getTranslations("admin"),
    getFormatter(),
  ]);

  const [book, viewer] = await Promise.all([
    prisma.book.findUnique({
      where: { id },
      include: {
        translations: true,
        images: { orderBy: { position: "asc" } },
        // Soonest back first: that date is the one to show when every copy is out.
        loans: {
          where: { status: "ACTIVE" },
          orderBy: { dueAt: "asc" },
          select: { dueAt: true, userId: true },
        },
      },
    }),
    getViewer(),
  ]);

  if (!book || !book.visible) notFound();

  const { value: text, isFallback } = pickTranslation(book.translations, locale);
  const copies = Math.max(1, book.copies);
  const copiesFree = Math.max(0, copies - book.loans.length);
  const available = copiesFree > 0;
  const nextBack = book.loans[0];
  const viewerHasIt = Boolean(viewer && book.loans.some((loan) => loan.userId === viewer.id));

  const activeCount = viewer
    ? await prisma.loan.count({
        where: { userId: viewer.id, status: "ACTIVE" },
      })
    : 0;

  let blocked: string | undefined;
  if (viewerHasIt) blocked = t("youHaveIt");
  else if (!available)
    blocked = t("onLoanUntil", {
      date: format.dateTime(nextBack.dueAt, { dateStyle: "medium" }),
    });
  else if (!viewer) blocked = t("signInToBorrow");
  else if (!canBorrow(viewer)) blocked = t("notPaid");
  else if (activeCount >= MAX_ACTIVE_LOANS)
    blocked = t("atLimit", { max: MAX_ACTIVE_LOANS });

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-xs text-muted transition-colors hover:text-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="m15 6-6 6 6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("back")}
        </Link>
        {isAdmin(viewer) && (
          <Link
            href={`/admin/inventory/${book.id}/edit`}
            className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-xs text-accent transition-colors hover:bg-accent-soft"
          >
            {a("edit")}
          </Link>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <BookCover
          url={book.images[0]?.url ?? null}
          sizes="176px"
          priority
          className="w-44"
        >
          {book.bannerText && (
            <BookBanner text={book.bannerText} color={book.bannerColor} size="lg" />
          )}
        </BookCover>
      </div>

      <section className="mt-7 rounded-t-[28px] border border-border bg-surface p-6 pb-10">
        <p className="eyebrow">{book.shelfMark}</p>
        <h1 className="mt-3 font-display text-3xl leading-tight font-semibold">
          {text?.title ?? book.shelfMark}
        </h1>
        <p className="mt-2 text-sm text-muted">{book.author}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={available ? "available" : "onloan"}>
            {available ? t("onShelf") : t("onLoan")}
          </Badge>
          {copies > 1 && (
            <Badge>{t("copiesOnShelf", { free: copiesFree, total: copies })}</Badge>
          )}
          {book.showPageCount && book.pageCount ? (
            <Badge>{t("pages", { count: book.pageCount })}</Badge>
          ) : null}
          {isFallback && text ? <Badge>{t("noTranslation")}</Badge> : null}
        </div>

        {book.showDescription && text?.description ? (
          <p className="mt-6 text-sm leading-relaxed whitespace-pre-line text-foreground/85">
            {text.description}
          </p>
        ) : null}

        {book.showAuthorBio && text?.authorBio ? (
          <div className="mt-6 border-t border-border pt-5">
            <p className="eyebrow">{t("aboutAuthor")}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{text.authorBio}</p>
          </div>
        ) : null}

        <div className="mt-8">
          <BorrowButton bookId={book.id} disabled={Boolean(blocked)} reason={blocked} />
          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
            {t("terms")}
          </p>
        </div>
      </section>
    </div>
  );
}
