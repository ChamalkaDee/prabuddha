import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { BookCard } from "@/components/book-card";
import { Link } from "@/i18n/navigation";
import { pickTranslation } from "@/lib/book-i18n";
import { categoryName } from "@/lib/category";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const chip =
  "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs whitespace-nowrap transition-colors";
const chipOn = "bg-accent font-medium text-accent-contrast";
const chipOff = "border border-border text-muted hover:border-accent/50 hover:text-accent";

export default async function CataloguePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string; show?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const { cat, show } = await searchParams;
  const onlyAvailable = show === "available";
  const [t, b] = await Promise.all([
    getTranslations("catalogue"),
    getTranslations("book"),
  ]);

  const [books, categories] = await Promise.all([
    prisma.book.findMany({
      where: { visible: true },
      include: {
        translations: true,
        images: { orderBy: { position: "asc" }, take: 1 },
        categories: { select: { category: { select: { slug: true } } } },
        _count: { select: { loans: { where: { status: "ACTIVE" } } } },
      },
      // Pinned books first, then newest arrivals.
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    }),
    prisma.category.findMany({ orderBy: [{ position: "asc" }, { nameEn: "asc" }] }),
  ]);

  const shaped = books.map((b) => {
    const copies = Math.max(1, b.copies);
    const copiesFree = Math.max(0, copies - b._count.loans);
    return {
      id: b.id,
      shelfMark: b.shelfMark,
      title: pickTranslation(b.translations, locale).value?.title ?? b.shelfMark,
      author: b.author,
      cover: b.images[0]?.url ?? null,
      available: copiesFree > 0,
      copiesFree,
      copies,
      pinned: b.pinned,
      bannerText: b.bannerText,
      bannerColor: b.bannerColor,
      slugs: b.categories.map((c) => c.category.slug),
    };
  });

  const active = categories.find((c) => c.slug === cat);
  const inCategory = active ? shaped.filter((b) => b.slugs.includes(active.slug)) : shaped;
  const visible = onlyAvailable ? inCategory.filter((b) => b.available) : inCategory;

  const total = shaped.length;
  const onShelf = shaped.filter((b) => b.available).length;
  const counts = new Map<string, number>();
  for (const book of shaped) {
    for (const slug of book.slugs) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  const query = (next: { cat?: string; show?: string }) => {
    const q = Object.fromEntries(
      Object.entries(next).filter((entry): entry is [string, string] => Boolean(entry[1])),
    );
    return Object.keys(q).length ? { pathname: "/" as const, query: q } : "/";
  };

  return (
    <div className="pt-5">
      {/* A compact ledger line instead of a headline: the books are the page. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-[34px] leading-none font-semibold text-accent tabular-nums">
            {onShelf}
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-[11px] leading-none font-medium tracking-wide text-foreground uppercase">
              {t("onShelfLabel")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-16 overflow-hidden rounded-full bg-surface-high">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${total ? (onShelf / total) * 100 : 0}%` }}
                />
              </span>
              <span className="font-mono text-[10px] leading-none text-muted">
                {t("ofTotal", { total })}
              </span>
            </span>
          </span>
        </div>
        <Link
          href={query({ cat: active?.slug, show: onlyAvailable ? undefined : "available" })}
          className={cn(chip, onlyAvailable ? chipOn : chipOff)}
          aria-pressed={onlyAvailable}
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              onlyAvailable ? "bg-accent-contrast" : "bg-accent",
            )}
          />
          {t("filterAvailable")}
        </Link>
      </div>

      <nav
        aria-label={t("categoriesLabel")}
        className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
      >
        <Link
          href={query({ show: onlyAvailable ? "available" : undefined })}
          className={cn(chip, !active ? chipOn : chipOff)}
        >
          {t("filterAll")}
        </Link>
        {categories
          .filter((c) => counts.get(c.slug))
          .map((c) => (
            <Link
              key={c.id}
              href={query({ cat: c.slug, show: onlyAvailable ? "available" : undefined })}
              className={cn(chip, active?.id === c.id ? chipOn : chipOff)}
            >
              {categoryName(c, locale)}
              <span className="font-mono text-[10px] opacity-60">{counts.get(c.slug)}</span>
            </Link>
          ))}
      </nav>

      {visible.length === 0 ? (
        <div className="card mt-5 px-6 py-14 text-center">
          <p className="font-display text-lg">{t("emptyTitle")}</p>
          <p className="mt-2 text-sm text-muted">
            {total === 0 ? t("emptyAdmin") : t("emptyCategory")}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-5 sm:gap-y-7">
          {visible.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              priority={index < 6}
              onLoanLabel={b("onLoan")}
              copiesLabel={b("copiesFree", { free: book.copiesFree, total: book.copies })}
              pinnedLabel={b("pinned")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
