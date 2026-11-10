import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Inter,
  JetBrains_Mono,
  Noto_Sans_Sinhala,
  Noto_Serif_Sinhala,
} from "next/font/google";
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

export const viewport: Viewport = {
  themeColor: "#f6f0e4",
};

// Self-hosted by next/font: no render-blocking request to Google on every
// page, and the files are served from the same CDN as the app.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
});
const sinhalaSans = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  weight: ["400", "500", "600"],
  variable: "--font-noto-sans-sinhala",
  display: "swap",
});
const sinhalaSerif = Noto_Serif_Sinhala({
  subsets: ["sinhala"],
  weight: ["400", "600"],
  variable: "--font-noto-serif-sinhala",
  display: "swap",
});

const fontVariables = [
  fraunces.variable,
  inter.variable,
  mono.variable,
  sinhalaSans.variable,
  sinhalaSerif.variable,
].join(" ");

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
    <html lang={locale} dir="ltr" className={fontVariables}>
      <body className="min-h-dvh pb-32">
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
