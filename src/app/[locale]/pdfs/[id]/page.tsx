import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getViewer, isAdmin } from "@/lib/access";
import { PdfReader } from "@/components/pdf-reader";
import { downloadUrl } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

async function findPdf(id: string) {
  const pdf = await prisma.pdfBook.findUnique({ where: { id } });
  // Hidden PDFs stay readable for admins, so they can check one before showing it.
  if (!pdf || (!pdf.visible && !isAdmin(await getViewer()))) return null;
  return pdf;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const pdf = await findPdf((await params).id);
  return pdf ? { title: `${pdf.title} · Prabuddha` } : {};
}

export default async function PdfReaderPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale as Locale);

  const pdf = await findPdf(id);
  if (!pdf) notFound();

  return (
    <PdfReader
      url={pdf.fileUrl}
      downloadUrl={downloadUrl(pdf.fileUrl, pdf.fileName)}
      title={pdf.title}
    />
  );
}
