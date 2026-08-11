import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/field";
import { daysUntil } from "@/lib/utils";
import { EXTEND_WINDOW_DAYS, addDays } from "@/lib/loans";
import { pickTranslation } from "@/lib/book-i18n";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function AdminOverview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const [t, format] = await Promise.all([
    getTranslations("admin"),
    getFormatter(),
  ]);

  const [books, onLoan, unpaid, attention] = await Promise.all([
    prisma.book.count(),
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.loan.findMany({
      where: {
        status: "ACTIVE",
        dueAt: { lte: addDays(new Date(), EXTEND_WINDOW_DAYS) },
      },
      include: { book: { include: { translations: true } }, user: true },
      orderBy: { dueAt: "asc" },
    }),
  ]);

  const stats = [
    { label: t("statBooks"), value: books },
    { label: t("statOnLoan"), value: onLoan },
    { label: t("statUnpaid"), value: unpaid },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-[11px] leading-snug text-muted">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-accent">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {unpaid > 0 && (
        <p className="rounded-2xl bg-accent-soft px-5 py-4 text-xs leading-relaxed">
          {t("unpaidNotice", { count: unpaid })}{" "}
          <Link href="/admin/members" className="text-accent underline">
            {t("reviewMembers")}
          </Link>
        </p>
      )}

      <section>
        <p className="eyebrow">{t("dueSoon", { days: EXTEND_WINDOW_DAYS })}</p>
        {attention.length === 0 ? (
          <p className="card mt-4 px-5 py-10 text-center text-sm text-muted">
            {t("nothingDue")}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {attention.map((loan) => {
              const left = daysUntil(loan.dueAt);
              return (
                <li
                  key={loan.id}
                  className="card flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {pickTranslation(loan.book.translations, locale).value?.title ??
                        loan.book.shelfMark}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted">
                      {loan.user.email} ·{" "}
                      {format.dateTime(loan.dueAt, { dateStyle: "medium" })}
                    </p>
                  </div>
                  <Badge tone={left < 0 ? "overdue" : "onloan"}>
                    {left < 0 ? `${Math.abs(left)}d` : `${left}d`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
