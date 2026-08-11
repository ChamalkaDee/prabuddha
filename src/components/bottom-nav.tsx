import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getViewer, isAdmin } from "@/lib/access";
import { LanguageSwitcher } from "@/components/language-switcher";

/**
 * Floating pill nav. Sits above the safe area so it stays in thumb reach
 * on a phone rather than flush against the home indicator.
 */
export async function BottomNav() {
  const [viewer, t] = await Promise.all([getViewer(), getTranslations("nav")]);

  const items = [
    { href: "/", label: t("shelf"), icon: ShelfIcon },
    { href: "/my-loans", label: t("myLoans"), icon: LoansIcon },
    isAdmin(viewer)
      ? { href: "/admin", label: t("admin"), icon: AdminIcon }
      : { href: "/signin", label: t("account"), icon: AccountIcon },
  ];

  return (
    <nav
      className="fixed inset-x-0 z-40 px-5"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-around gap-1 rounded-full border border-border bg-surface/95 p-2 backdrop-blur-xl">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-1.5 text-muted transition-colors hover:text-accent"
          >
            <Icon />
            <span className="text-[10px] leading-none">{label}</span>
          </Link>
        ))}
        <div className="sm:hidden">
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ShelfIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path {...stroke} d="M4 19V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v13" />
      <path {...stroke} d="M4 19h15M9 4v15M14 4v15" />
    </svg>
  );
}
function LoansIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path {...stroke} d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
function AccountIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <circle {...stroke} cx="12" cy="8.5" r="3.5" />
      <path {...stroke} d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}
function AdminIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path {...stroke} d="M12 3.5 19 7v5.5c0 4-3 7-7 8-4-1-7-4-7-8V7l7-3.5Z" />
      <path {...stroke} d="m9.5 12 1.8 1.8 3.4-3.6" />
    </svg>
  );
}
