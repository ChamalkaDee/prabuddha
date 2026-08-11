import { fallbackChain, type Locale } from "@/i18n/routing";

export type Translation = {
  locale: string;
  title: string;
  description: string | null;
  authorBio: string | null;
};

/**
 * Pick the best translation for a locale. Falls through the chain rather
 * than showing an empty card — a Sinhala title is more use to a reader
 * than a blank one.
 */
export function pickTranslation(
  translations: Translation[],
  locale: Locale,
): { value: Translation | null; isFallback: boolean } {
  for (const [index, candidate] of fallbackChain[locale].entries()) {
    const match = translations.find((t) => t.locale === candidate);
    if (match) return { value: match, isFallback: index > 0 };
  }
  return { value: translations[0] ?? null, isFallback: true };
}

/** Convenience for lists where only the title matters. */
export function titleFor(translations: Translation[], locale: Locale) {
  return pickTranslation(translations, locale).value?.title ?? "—";
}
