"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Short labels for the phone bottom bar, where full names do not fit. */
const shortNames: Record<Locale, string> = { si: "සිං", en: "EN", it: "IT" };

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  return (
    <div className={cn("flex items-center rounded-full border border-border p-1", compact ? "gap-0.5" : "gap-1")}>
      {locales.map((code) => (
        <button
          key={code}
          disabled={pending}
          onClick={() => start(() => router.replace(pathname, { locale: code }))}
          aria-label={localeNames[code]}
          aria-current={code === locale ? "true" : undefined}
          className={cn(
            "rounded-full py-2 text-[13px]",
            compact ? "px-2" : "px-3",
            code === locale
              ? "bg-accent-soft text-accent"
              : "text-muted transition-colors hover:text-foreground",
          )}
        >
          {compact ? shortNames[code] : localeNames[code]}
        </button>
      ))}
    </div>
  );
}
