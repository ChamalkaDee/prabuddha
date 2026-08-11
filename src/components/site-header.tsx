import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getViewer } from "@/lib/access";
import { LogoMark } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { signOut } from "@/auth";

export async function SiteHeader() {
  const [viewer, t] = await Promise.all([getViewer(), getTranslations("nav")]);
  const brand = await getTranslations("brand");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="flex flex-col leading-none">
            <span className="font-display text-base text-foreground">
              {brand("name")}
            </span>
            <span className="mt-0.5 text-[9px] tracking-[0.22em] text-accent uppercase">
              {brand("library")}
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          {viewer ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded-full border border-border px-4 py-2.5 text-xs text-muted transition-colors hover:text-foreground">
                {t("signOut")}
              </button>
            </form>
          ) : (
            <Link
              href="/signin"
              className="rounded-full bg-accent px-5 py-2.5 text-xs font-medium text-accent-contrast transition-all hover:brightness-110"
            >
              {t("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
