import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/field";
import { NewPdfForm, PdfEditor } from "@/components/pdf-admin";
import { formatFileSize } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function AdminPdfsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale as Locale);
  const t = await getTranslations("admin");

  const pdfs = await prisma.pdfBook.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <p className="eyebrow">{t("pdfAddTitle")}</p>
        <NewPdfForm />
      </div>

      <p className="eyebrow">{t("pdfCount", { count: pdfs.length })}</p>
      <ul className="space-y-3">
        {pdfs.map((pdf) => (
          <li key={pdf.id} className="card flex gap-4 p-5">
            <Link href={`/pdfs/${pdf.id}`} className="shrink-0">
              {pdf.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pdf.coverUrl}
                  alt=""
                  className="h-24 w-[72px] rounded-[8px] border border-border object-cover object-top"
                />
              ) : (
                <span className="flex h-24 w-[72px] items-center justify-center rounded-[8px] border border-border font-mono text-xs text-muted">
                  PDF
                </span>
              )}
              <span className="mt-1.5 block font-mono text-[10px] text-muted">
                {formatFileSize(pdf.fileSize)}
              </span>
              {!pdf.visible && <Badge className="mt-1.5">{t("hidden")}</Badge>}
            </Link>
            <PdfEditor
              pdf={{
                id: pdf.id,
                title: pdf.title,
                author: pdf.author,
                description: pdf.description,
                visible: pdf.visible,
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
