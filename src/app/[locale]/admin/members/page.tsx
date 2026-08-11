import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/access";
import { addMember } from "@/actions/members";
import { Input, Label, Badge, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { PaidToggle, RoleControl, RevokeButton } from "@/components/admin-actions";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; added?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const { error, added } = await searchParams;

  const [viewer, t, format] = await Promise.all([
    getViewer(),
    getTranslations("admin"),
    getFormatter(),
  ]);

  const members = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { loans: true } } },
  });

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-2xl bg-alert/12 px-5 py-4 text-xs text-alert">{error}</p>
      )}
      {added && (
        <p className="rounded-2xl bg-accent-soft px-5 py-4 text-xs text-accent">
          {t("added", { email: added })}
        </p>
      )}

      <section className="card p-6">
        <p className="eyebrow">{t("addMemberEyebrow")}</p>
        <h2 className="mt-2 font-display text-xl font-semibold">
          {t("addMemberTitle")}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {t("addMemberIntro")}
        </p>

        <form action={addMember} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">{t("emailAddress")}</Label>
            <Input id="email" name="email" type="email" required placeholder="member@gmail.com" />
          </div>
          <div>
            <Label htmlFor="notes">{t("note")}</Label>
            <Input id="notes" name="notes" placeholder={t("notePlaceholder")} />
          </div>
          <label className="flex items-center gap-3 text-xs">
            <Checkbox name="markPaid" />
            {t("alreadyPaid")}
          </label>
          <Button type="submit">{t("addMember")}</Button>
        </form>
      </section>

      <section>
        <p className="eyebrow">{t("directory", { count: members.length })}</p>
        <ul className="mt-4 space-y-3">
          {members.map((m) => (
            <li key={m.id} className="card p-5">
              <p className="truncate text-sm">{m.name ?? m.email}</p>
              <p className="truncate font-mono text-[10px] text-muted">{m.email}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    m.status === "ACTIVE"
                      ? "available"
                      : m.status === "REVOKED"
                        ? "overdue"
                        : "onloan"
                  }
                >
                  {m.status === "ACTIVE"
                    ? t("paid")
                    : m.status === "REVOKED"
                      ? t("revoked")
                      : t("pending")}
                </Badge>
                {m.paidAt && (
                  <span className="font-mono text-[10px] text-muted">
                    {t("since", {
                      date: format.dateTime(m.paidAt, { dateStyle: "medium" }),
                    })}
                  </span>
                )}
                <span className="font-mono text-[10px] text-muted">
                  {t("loanCount", { count: m._count.loans })}
                </span>
              </div>

              {m.notes && <p className="mt-2 text-[11px] text-muted">{m.notes}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <PaidToggle userId={m.id} paid={m.status === "ACTIVE"} />
                {viewer?.role === "SUPER_ADMIN" && (
                  <RoleControl userId={m.id} role={m.role} />
                )}
                {m.role !== "SUPER_ADMIN" && <RevokeButton userId={m.id} />}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
