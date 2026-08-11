import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { signIn, auth } from "@/auth";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale } from "@/i18n/routing";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user) redirect(`/${locale}`);

  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-sm pt-12 pb-8">
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-lockup.png" alt="" className="h-40 w-auto object-contain" />
      </div>

      <p className="rule-label mt-8 justify-center">{t("eyebrow")}</p>
      <h1 className="mt-4 text-center font-display text-3xl font-semibold">
        {t("title")}
      </h1>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted">
        {t("intro")}
      </p>

      <form
        className="mt-8"
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: `/${locale}` });
        }}
      >
        <Button className="w-full">{t("google")}</Button>
      </form>

      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] text-muted">{t("or")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          await signIn("resend", {
            email: String(formData.get("email")),
            redirectTo: `/${locale}`,
          });
        }}
      >
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder={t("emailPlaceholder")}
        />
        <Button variant="outline" className="mt-3 w-full">
          {t("sendLink")}
        </Button>
      </form>

      <div className="mt-10 flex justify-center">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
