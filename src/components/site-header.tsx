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
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark size={44} />
          <span className="flex flex-col leading-none">
            <span className="brand-name text-[21px] text-foreground">
              {brand("name")}
            </span>
            <span className="mt-1 text-[10.5px] tracking-[0.22em] text-accent uppercase">
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
              <button className="rounded-full border border-border px-5 py-3 text-sm text-muted transition-colors hover:text-foreground">
                {t("signOut")}
              </button>
            </form>
          ) : (
            <Link
              href="/signin"
              className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-contrast transition-all hover:brightness-110"
            >
              {t("signIn")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
