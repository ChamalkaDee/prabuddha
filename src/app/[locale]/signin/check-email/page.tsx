import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export default async function CheckEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-sm pt-24 text-center">
      <p className="rule-label justify-center">{t("checkEyebrow")}</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        {t("checkTitle")}
      </h1>
      <p className="mt-4 text-xs leading-relaxed text-muted">{t("checkBody")}</p>
    </div>
  );
}
