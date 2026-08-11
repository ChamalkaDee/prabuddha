import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/access";
import { Badge } from "@/components/ui/field";
import { ExtendButton } from "@/components/borrow-button";
import { daysUntil } from "@/lib/utils";
import { canExtend, loanHealth, MAX_ACTIVE_LOANS } from "@/lib/loans";
import { pickTranslation } from "@/lib/book-i18n";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function MyLoansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const viewer = await getViewer();
  if (!viewer) redirect(`/${locale}/signin`);

  const [t, format] = await Promise.all([
    getTranslations("loans"),
    getFormatter(),
  ]);

  const loans = await prisma.loan.findMany({
    where: { userId: viewer.id },
    include: { book: { include: { translations: true } } },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
  });

  const active = loans.filter((l) => l.status === "ACTIVE");
  const past = loans.filter((l) => l.status === "RETURNED");

  return (
    <div className="pt-8">
      <p className="rule-label">
        {t("slots", { used: active.length, max: MAX_ACTIVE_LOANS })}
      </p>
      <h1 className="mt-4 font-display text-[34px] font-semibold">
        {t("title")}
      </h1>

      {viewer.status !== "ACTIVE" && (
        <p className="mt-6 rounded-2xl border border-dashed border-border px-5 py-4 text-xs leading-relaxed text-muted">
          {t("notPaidNotice")}
        </p>
      )}

      {active.length === 0 ? (
        <div className="card mt-7 px-6 py-12 text-center">
          <p className="text-sm text-muted">{t("empty")}</p>
          <Link href="/" className="mt-3 inline-block text-sm text-accent underline">
            {t("browse")}
          </Link>
        </div>
      ) : (
        <ul className="mt-7 space-y-3">
          {active.map((loan) => {
            const health = loanHealth(loan.dueAt);
            const left = daysUntil(loan.dueAt);
            const title =
              pickTranslation(loan.book.translations, locale).value?.title ??
              loan.book.shelfMark;

            return (
              <li key={loan.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="eyebrow">{loan.book.shelfMark}</p>
                    <h2 className="mt-1.5 font-display text-lg font-semibold">
                      {title}
                    </h2>
                    <p className="text-xs text-muted">{loan.book.author}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      tone={
                        health === "overdue"
                          ? "overdue"
                          : health === "due-soon"
                            ? "onloan"
                            : "available"
                      }
                    >
                      {health === "overdue"
                        ? t("overdue", { days: Math.abs(left) })
                        : t("dueIn", { days: left })}
                    </Badge>
                    <p className="mt-2 font-mono text-[10px] text-muted">
                      {format.dateTime(loan.dueAt, { dateStyle: "medium" })}
                    </p>
                  </div>
                </div>

                {loan.extensionCount > 0 && (
                  <p className="mt-3 text-[11px] text-accent">
                    {t("alreadyExtended")}
                  </p>
                )}

                {canExtend(loan) && (
                  <div className="mt-5">
                    <ExtendButton loanId={loan.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {past.length > 0 && (
        <section className="mt-12">
          <p className="eyebrow">{t("returned")}</p>
          <ul className="mt-3 divide-y divide-border">
            {past.map((loan) => (
              <li
                key={loan.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <span className="min-w-0 truncate">
                  {pickTranslation(loan.book.translations, locale).value?.title ??
                    loan.book.shelfMark}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-muted">
                  {loan.returnedAt
                    ? format.dateTime(loan.returnedAt, { dateStyle: "medium" })
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
