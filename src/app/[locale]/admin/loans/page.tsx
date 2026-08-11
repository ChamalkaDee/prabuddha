import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/field";
import { ReturnButton } from "@/components/admin-actions";
import { daysUntil } from "@/lib/utils";
import { pickTranslation } from "@/lib/book-i18n";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function AdminLoansPage({
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

  const loans = await prisma.loan.findMany({
    where: { status: "ACTIVE" },
    include: { book: { include: { translations: true } }, user: true },
    orderBy: { dueAt: "asc" },
  });

  return (
    <div className="space-y-5">
      <p className="eyebrow">{t("loansOut", { count: loans.length })}</p>

      {loans.length === 0 ? (
        <p className="card px-5 py-14 text-center text-sm text-muted">
          {t("allReturned")}
        </p>
      ) : (
        <ul className="space-y-3">
          {loans.map((loan) => {
            const left = daysUntil(loan.dueAt);
            return (
              <li key={loan.id} className="card p-5">
                <p className="eyebrow">{loan.book.shelfMark}</p>
                <p className="mt-1.5 text-sm">
                  {pickTranslation(loan.book.translations, locale).value?.title ??
                    loan.book.shelfMark}
                </p>
                <p className="truncate font-mono text-[10px] text-muted">
                  {loan.user.email}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={left < 0 ? "overdue" : left <= 3 ? "onloan" : "neutral"}>
                    {left < 0 ? `${Math.abs(left)}d` : `${left}d`}
                  </Badge>
                  {loan.extensionCount > 0 && (
                    <Badge tone="onloan">{t("extendedFlag")}</Badge>
                  )}
                  <span className="font-mono text-[10px] text-muted">
                    {format.dateTime(loan.dueAt, { dateStyle: "medium" })}
                  </span>
                </div>

                <div className="mt-4">
                  <ReturnButton loanId={loan.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
