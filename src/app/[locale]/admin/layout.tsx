import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/access";
import type { Locale } from "@/i18n/routing";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const viewer = await requireAdmin();
  const t = await getTranslations("admin");

  const tabs = [
    { href: "/admin", label: t("tabOverview") },
    { href: "/admin/members", label: t("tabMembers") },
    { href: "/admin/inventory", label: t("tabInventory") },
    { href: "/admin/loans", label: t("tabLoans") },
  ];

  return (
    <div className="pt-8">
      <p className="rule-label">
        {viewer.role === "SUPER_ADMIN" ? t("superAdmin") : t("admin")}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{t("title")}</h1>

      <nav className="mt-6 -mx-1 flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="shrink-0 rounded-full border border-border px-4 py-2.5 text-xs text-muted transition-colors hover:border-accent/50 hover:text-accent"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="py-7">{children}</div>
    </div>
  );
}
