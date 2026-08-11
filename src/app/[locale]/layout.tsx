import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "ප්‍රබුද්ධ Prabuddha Library",
  description:
    "A members' lending library. Browse the shelf freely; borrow in person at the shop.",
  icons: { icon: "/icon-192.png", apple: "/icon-1024.png" },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Sinhala:wght@400;500;600&family=Noto+Serif+Sinhala:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh pb-28">
        <NextIntlClientProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-3xl px-5 sm:px-8">
            {children}
          </main>
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
