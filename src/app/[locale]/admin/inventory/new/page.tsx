import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { NewBookForm } from "@/components/new-book-form";
import type { Locale } from "@/i18n/routing";

export default async function NewBookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale as Locale);
  const t = await getTranslations("admin");

  return (
    <div className="max-w-xl">
      <Link href="/admin/inventory" className="eyebrow">
        ← {t("tabInventory")}
      </Link>
      <h2 className="mt-3 font-display text-2xl font-semibold">{t("addBook")}</h2>
      <NewBookForm />
    </div>
  );
}
