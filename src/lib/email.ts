import { Resend } from "resend";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

const resend = process.env.AUTH_RESEND_KEY
  ? new Resend(process.env.AUTH_RESEND_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
const SHOP = process.env.SHOP_DETAILS ?? "the distributor shop";
const SITE = process.env.NEXTAUTH_URL ?? "https://prabudda-books.vercel.app";

function fmt(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "si" ? "si-LK" : locale, {
    dateStyle: "medium",
  }).format(date);
}

function shell(locale: Locale, heading: string, body: string, footer: string) {
  const stack =
    locale === "si"
      ? "'Noto Sans Sinhala',Inter,Helvetica,Arial,sans-serif"
      : "Inter,Helvetica,Arial,sans-serif";
  return `<div style="font-family:${stack};background:#1c0f0e;padding:32px 20px">
    <div style="max-width:520px;margin:0 auto;background:#2a1614;border-radius:20px;padding:28px;color:#f5ede6">
      <p style="font-size:11px;letter-spacing:.2em;color:#e0c892;margin:0 0 10px">PRABUDDHA</p>
      <h1 style="font-family:Georgia,serif;font-size:23px;margin:0 0 18px;color:#f5ede6">${heading}</h1>
      ${body}
      <hr style="border:none;border-top:1px solid #6e2b264d;margin:24px 0" />
      <p style="font-size:12px;color:#a98a80;margin:0">${footer}</p>
    </div>
  </div>`;
}

export async function sendLoanConfirmation(opts: {
  to: string;
  locale: Locale;
  bookTitle: string;
  author: string;
  dueAt: Date;
}) {
  if (!resend) return;
  const t = await getTranslations({ locale: opts.locale, namespace: "email" });
  const date = fmt(opts.dueAt, opts.locale);

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: t("confirmSubject", { title: opts.bookTitle }),
    html: shell(
      opts.locale,
      t("confirmHeading"),
      `<p style="line-height:1.7;margin:0 0 12px">${t("confirmBody", { title: opts.bookTitle, author: opts.author })}</p>
       <p style="line-height:1.7;margin:0 0 18px">${t("confirmCollect", { shop: SHOP, date })}</p>
       <a href="${SITE}/${opts.locale}/my-loans" style="display:inline-block;background:#e0c892;color:#241804;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px">${t("viewLoans")}</a>`,
      t("footer", { shop: SHOP }),
    ),
  });
}

export async function sendReturnReminder(opts: {
  to: string;
  locale: Locale;
  bookTitle: string;
  dueAt: Date;
  canExtend: boolean;
}) {
  if (!resend) return;
  const t = await getTranslations({ locale: opts.locale, namespace: "email" });
  const date = fmt(opts.dueAt, opts.locale);

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: t("reminderSubject", { title: opts.bookTitle, date }),
    html: shell(
      opts.locale,
      t("reminderHeading"),
      `<p style="line-height:1.7;margin:0 0 12px">${t("reminderBody", { title: opts.bookTitle, date })}</p>
       <p style="line-height:1.7;margin:0 0 18px">${opts.canExtend ? t("reminderCanExtend", { shop: SHOP }) : t("reminderCannotExtend", { shop: SHOP })}</p>
       <a href="${SITE}/${opts.locale}/my-loans" style="display:inline-block;background:#e0c892;color:#241804;padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px">${t("viewLoans")}</a>`,
      t("footer", { shop: SHOP }),
    ),
  });
}
