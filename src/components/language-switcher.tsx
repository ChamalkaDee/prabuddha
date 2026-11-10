"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/routing";

/** Short labels for the phone bottom bar, where full names do not fit. */
const shortNames: Record<Locale, string> = { si: "සිං", en: "EN", it: "IT" };

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border p-1">
      {locales.map((code) => (
        <button
          key={code}
          disabled={pending}
          onClick={() => start(() => router.replace(pathname, { locale: code }))}
          aria-label={localeNames[code]}
          aria-current={code === locale ? "true" : undefined}
          className={
            code === locale
              ? "rounded-full bg-accent-soft px-2.5 py-1.5 text-[11px] text-accent"
              : "rounded-full px-2.5 py-1.5 text-[11px] text-muted transition-colors hover:text-foreground"
          }
        >
          {compact ? shortNames[code] : localeNames[code]}
        </button>
      ))}
    </div>
  );
}
