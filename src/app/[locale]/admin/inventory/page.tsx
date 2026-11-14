import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { BookRowActions } from "@/components/admin-actions";
import { pickTranslation } from "@/lib/book-i18n";
import { categoryName } from "@/lib/category";
import { locales, type Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const [t, b] = await Promise.all([
    getTranslations("admin"),
    getTranslations("book"),
  ]);

  const books = await prisma.book.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: {
      translations: true,
      loans: { where: { status: "ACTIVE" }, select: { id: true } },
      categories: {
        select: { category: true },
        orderBy: { category: { position: "asc" } },
      },
      _count: { select: { loans: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">{t("titlesCatalogued", { count: books.length })}</p>
        <Link href="/admin/inventory/new">
          <Button>{t("addBook")}</Button>
        </Link>
      </div>

      {books.length === 0 ? (
        <p className="card px-5 py-14 text-center text-sm text-muted">
          {t("inventoryEmpty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {books.map((book) => {
            const out = book.loans.length;
            const copies = Math.max(1, book.copies);
            const onLoan = out > 0;
            const allOut = out >= copies;
            const have = book.translations.map((tr) => tr.locale);
            return (
              <li key={book.id} className="card p-5">
                <p className="eyebrow">{book.shelfMark}</p>
                <p className="mt-1.5 text-sm">
                  {pickTranslation(book.translations, locale).value?.title ??
                    book.shelfMark}
                </p>
                <p className="truncate text-xs text-muted">{book.author}</p>
                <p className="mt-1 text-[11px] text-accent">
                  {book.categories.length > 0
                    ? book.categories.map(({ category }) => categoryName(category, locale)).join(" · ")
                    : t("noCategory")}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={allOut ? "onloan" : "available"}>
                    {allOut ? b("onLoan") : b("onShelf")}
                  </Badge>
                  {copies > 1 && (
                    <Badge>{b("copiesOnShelf", { free: copies - Math.min(out, copies), total: copies })}</Badge>
                  )}
                  {book.pinned && <Badge tone="available">{b("pinned")}</Badge>}
                  {book.bannerText && <Badge>“{book.bannerText}”</Badge>}
                  {!book.visible && <Badge>{t("hidden")}</Badge>}
                  <span className="font-mono text-[10px] text-muted">
                    {t("lentTimes", { count: book._count.loans })}
                  </span>
                  <span className="flex gap-1">
                    {locales.map((code) => (
                      <span
                        key={code}
                        className={
                          have.includes(code)
                            ? "rounded-full bg-accent-soft px-2 py-1 font-mono text-[9px] text-accent uppercase"
                            : "rounded-full border border-border px-2 py-1 font-mono text-[9px] text-muted/50 uppercase"
                        }
                      >
                        {code}
                      </span>
                    ))}
                  </span>
                </div>

                <div className="mt-4">
                  <BookRowActions
                    bookId={book.id}
                    visible={book.visible}
                    pinned={book.pinned}
                    onLoan={onLoan}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
