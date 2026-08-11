import { defineRouting } from "next-intl/routing";

export const locales = ["si", "en", "it"] as const;
export type Locale = (typeof locales)[number];

/** Shown in the language switcher, in each language's own script. */
export const localeNames: Record<Locale, string> = {
  si: "සිංහල",
  en: "English",
  it: "Italiano",
};

/**
 * If a book has no translation for the requested language, try these in
 * order before giving up. Sinhala readers are the core audience, so the
 * chain always ends there.
 */
export const fallbackChain: Record<Locale, Locale[]> = {
  si: ["si", "en", "it"],
  en: ["en", "si", "it"],
  it: ["it", "en", "si"],
};

export const routing = defineRouting({
  locales,
  defaultLocale: "si",
  localePrefix: "always",
});
