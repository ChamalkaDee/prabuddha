import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { downloadUrl, formatFileSize } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

/** Free PDFs: open to everyone, no sign-in needed to read or download. */
export default async function PdfsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale as Locale);
  const t = await getTranslations("pdfs");

  const pdfs = await prisma.pdfBook.findMany({
    where: { visible: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pt-6">
      <p className="rule-label">{t("eyebrow")}</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t("intro")}</p>

      {pdfs.length === 0 ? (
        <div className="card mt-6 px-6 py-14 text-center">
          <p className="font-display text-lg">{t("emptyTitle")}</p>
          <p className="mt-2 text-sm text-muted">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-6">
          {pdfs.map((pdf, index) => (
            <li key={pdf.id} className="flex flex-col">
              <Link href={`/pdfs/${pdf.id}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] border border-border bg-surface">
                  {pdf.coverUrl ? (
                    <Image
                      src={pdf.coverUrl}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 230px, 45vw"
                      priority={index < 4}
                      className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-mono text-sm text-muted">
                      PDF
                    </span>
                  )}
                </div>
                <p className="mt-2.5 line-clamp-2 text-sm leading-snug font-medium group-hover:text-accent">
                  {pdf.title}
                </p>
              </Link>
              {pdf.author && <p className="mt-0.5 truncate text-xs text-muted">{pdf.author}</p>}
              <p className="mt-1 font-mono text-[10px] text-muted">
                {[pdf.pageCount ? t("pages", { count: pdf.pageCount }) : null, formatFileSize(pdf.fileSize)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-2.5 flex gap-2">
                <Link
                  href={`/pdfs/${pdf.id}`}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-accent px-3 text-xs font-medium text-accent-contrast transition-all hover:brightness-110"
                >
                  {t("read")}
                </Link>
                <a
                  href={downloadUrl(pdf.fileUrl, pdf.fileName)}
                  download
                  aria-label={t("download")}
                  title={t("download")}
                  className="inline-flex min-h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent/50 hover:text-accent"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
