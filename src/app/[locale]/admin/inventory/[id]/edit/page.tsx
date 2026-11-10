import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { BookForm, type BookFormValues } from "@/components/book-form";
import { locales, type Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  setRequestLocale(rawLocale as Locale);

  const [t, book] = await Promise.all([
    getTranslations("admin"),
    prisma.book.findUnique({
      where: { id },
      include: {
        translations: true,
        images: { orderBy: { position: "asc" } },
      },
    }),
  ]);
  if (!book) notFound();

  const values: BookFormValues = {
    id: book.id,
    shelfMark: book.shelfMark,
    author: book.author,
    pageCount: book.pageCount,
    showDescription: book.showDescription,
    showPageCount: book.showPageCount,
    showAuthorBio: book.showAuthorBio,
    visible: book.visible,
    imageUrls: book.images.map((image) => image.url),
    translations: Object.fromEntries(
      book.translations
        .filter((tr) => (locales as readonly string[]).includes(tr.locale))
        .map((tr) => [
          tr.locale,
          { title: tr.title, description: tr.description, authorBio: tr.authorBio },
        ]),
    ),
  };

  return (
    <div className="max-w-xl">
      <Link href="/admin/inventory" className="eyebrow">
        ← {t("tabInventory")}
      </Link>
      <h2 className="mt-3 font-display text-2xl font-semibold">{t("editBook")}</h2>
      <p className="mt-1 text-xs text-muted">{book.shelfMark}</p>
      <BookForm book={values} />
    </div>
  );
}
