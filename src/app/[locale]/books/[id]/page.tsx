import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { canBorrow, getViewer } from "@/lib/access";
import { Badge } from "@/components/ui/field";
import { BorrowButton } from "@/components/borrow-button";
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
  const [t, format] = await Promise.all([
    getTranslations("book"),
    getFormatter(),
  ]);

  const [book, viewer] = await Promise.all([
    prisma.book.findUnique({
      where: { id },
      include: {
        translations: true,
        images: { orderBy: { position: "asc" } },
        loans: { where: { status: "ACTIVE" }, take: 1 },
      },
    }),
    getViewer(),
  ]);

  if (!book || !book.visible) notFound();

  const { value: text, isFallback } = pickTranslation(book.translations, locale);
  const activeLoan = book.loans[0];
  const available = !activeLoan;

  const activeCount = viewer
    ? await prisma.loan.count({ where: { userId: viewer.id, status: "ACTIVE" } })
    : 0;

  let blocked: string | undefined;
  if (!available)
    blocked = t("onLoanUntil", {
      date: format.dateTime(activeLoan.dueAt, { dateStyle: "medium" }),
    });
  else if (!viewer) blocked = t("signInToBorrow");
  else if (!canBorrow(viewer)) blocked = t("notPaid");
  else if (activeCount >= MAX_ACTIVE_LOANS)
    blocked = t("atLimit", { max: MAX_ACTIVE_LOANS });

  return (
    <div className="pt-6">
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

      <div className="mt-4 flex justify-center">
        {book.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.images[0].url}
            alt=""
            className="h-56 w-40 rounded-2xl border border-border object-cover"
          />
        ) : (
          <div className="h-56 w-40 rounded-2xl bg-surface-high" />
        )}
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
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {text.authorBio}
            </p>
          </div>
        ) : null}

        <div className="mt-8">
          <BorrowButton
            bookId={book.id}
            disabled={Boolean(blocked)}
            reason={blocked}
          />
          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
            {t("terms")}
          </p>
        </div>
      </section>
    </div>
  );
}
