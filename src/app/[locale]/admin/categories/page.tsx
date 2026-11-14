import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { CategoryEditor, NewCategoryForm } from "@/components/category-admin";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale as Locale);
  const t = await getTranslations("admin");

  const categories = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { nameEn: "asc" }],
    include: { _count: { select: { books: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <p className="eyebrow">{t("addCategory")}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{t("categoriesHint")}</p>
        <NewCategoryForm />
      </div>

      <p className="eyebrow">{t("categoriesCount", { count: categories.length })}</p>
      <ul className="space-y-3">
        {categories.map((category) => (
          <li key={category.id} className="card p-5">
            <CategoryEditor
              category={{
                id: category.id,
                nameSi: category.nameSi,
                nameEn: category.nameEn,
                nameIt: category.nameIt,
              }}
              bookCount={category._count.books}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
