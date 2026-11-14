import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { BookCard } from "@/components/book-card";
import { Input } from "@/components/ui/field";
import { Link } from "@/i18n/navigation";
import { pickTranslation } from "@/lib/book-i18n";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function CataloguePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; show?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const { q = "", show } = await searchParams;
  const [t, b] = await Promise.all([
    getTranslations("catalogue"),
    getTranslations("book"),
  ]);

  const books = await prisma.book.findMany({
    where: {
      visible: true,
      ...(q
        ? {
            OR: [
              { author: { contains: q, mode: "insensitive" as const } },
              { shelfMark: { contains: q, mode: "insensitive" as const } },
              {
                translations: {
                  some: {
                    title: { contains: q, mode: "insensitive" as const },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      translations: true,
      images: { orderBy: { position: "asc" }, take: 1 },
      _count: { select: { loans: { where: { status: "ACTIVE" } } } },
    },
    // Pinned books first, then newest arrivals.
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

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
    };
  });

  const onShelf = shaped.filter((b) => b.available).length;
  const visible = show === "available" ? shaped.filter((b) => b.available) : shaped;

  return (
    <div className="pt-8">
      <p className="rule-label">{t("eyebrow")}</p>
      <h1 className="mt-4 font-display text-[34px] leading-[1.12] font-semibold sm:text-5xl">
        {t("heading", { count: onShelf })}
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
        {t("intro")}
      </p>

      <form className="mt-7">
        <Input name="q" defaultValue={q} placeholder={t("search")} />
        <div className="mt-3 flex gap-2">
          <Link
            href={q ? { pathname: "/", query: { q } } : "/"}
            className={
              show === "available"
                ? "rounded-full border border-border px-5 py-2.5 text-xs text-muted"
                : "rounded-full bg-accent px-5 py-2.5 text-xs font-medium text-accent-contrast"
            }
          >
            {t("filterAll")}
          </Link>
          <Link
            href={{ pathname: "/", query: { ...(q ? { q } : {}), show: "available" } }}
            className={
              show === "available"
                ? "rounded-full bg-accent px-5 py-2.5 text-xs font-medium text-accent-contrast"
                : "rounded-full border border-border px-5 py-2.5 text-xs text-muted"
            }
          >
            {t("filterAvailable")}
          </Link>
        </div>
      </form>

      {visible.length === 0 ? (
        <div className="card mt-7 px-6 py-14 text-center">
          <p className="font-display text-lg">{t("emptyTitle")}</p>
          <p className="mt-2 text-sm text-muted">
            {q ? t("emptySearch") : t("emptyAdmin")}
          </p>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-5 sm:gap-y-7">
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
