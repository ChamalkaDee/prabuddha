import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BookForm } from "@/components/book-form";
import { prisma } from "@/lib/prisma";
import { categoryName } from "@/lib/category";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function NewBookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale as Locale);
  const [t, categories] = await Promise.all([
    getTranslations("admin"),
    prisma.category.findMany({ orderBy: [{ position: "asc" }, { nameEn: "asc" }] }),
  ]);

  return (
    <div className="max-w-xl">
      <Link href="/admin/inventory" className="eyebrow">
        ← {t("tabInventory")}
      </Link>
      <h2 className="mt-3 font-display text-2xl font-semibold">{t("addBook")}</h2>
      <BookForm
        categories={categories.map((c) => ({ id: c.id, name: categoryName(c, rawLocale) }))}
      />
    </div>
  );
}
