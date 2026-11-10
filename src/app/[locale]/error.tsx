"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Replaces Next's bare "This page couldn't load" screen with one that says
 * what happened, offers a retry, and shows the digest that matches the
 * entry in the Vercel logs.
 */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card mt-10 px-6 py-12 text-center">
      <p className="font-display text-xl font-semibold">{t("title")}</p>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
        {t("body")}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>{t("retry")}</Button>
        <Link href="/">
          <Button variant="outline">{t("home")}</Button>
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-[10px] text-muted">
          {t("reference", { digest: error.digest })}
        </p>
      )}
    </div>
  );
}
