import type { Locale } from "@/i18n/routing";

export type CategoryNames = { nameSi: string; nameEn: string; nameIt: string };

/** A category's name in the reader's language, falling back to English. */
export function categoryName(category: CategoryNames, locale: Locale | string) {
  const name =
    locale === "si" ? category.nameSi : locale === "it" ? category.nameIt : category.nameEn;
  return name || category.nameEn || category.nameSi;
}

/** URL key from the English name: "Self-help & success" → "self-help-success". */
export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "category"
  );
}
