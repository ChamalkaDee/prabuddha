import { getTranslations } from "next-intl/server";

/** Where members collect and return books. Change it here and the strip follows. */
export const SHOP = {
  lines: ["CEYLON MARKET", "VIA GASPARE DEL CARRETTO 19B", "VERONA 37136", "ITALY"],
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Ceylon Market, Via Gaspare del Carretto 19B, 37136 Verona, Italy"),
  phone: "+39 329 599 0059",
  /** wa.me opens a WhatsApp chat with the shop; the call button is at the top of it. */
  whatsappUrl: "https://wa.me/393295990059",
} as const;

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.98L2 22l5.16-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.06.89.9-2.98-.2-.31a8.2 8.2 0 1 1 6.86 3.73Zm4.5-6.14c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06a6.7 6.7 0 0 1-1.97-1.22 7.4 7.4 0 0 1-1.37-1.7c-.14-.25 0-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.48a.92.92 0 0 0-.67.31 2.8 2.8 0 0 0-.87 2.08 4.86 4.86 0 0 0 1.02 2.58 11.1 11.1 0 0 0 4.25 3.76c.6.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.17-.48-.29Z" />
    </svg>
  );
}

/**
 * The shop's address scrolling right to left under the header, with a
 * WhatsApp button that stays still so it is easy to tap on a phone.
 * The text is rendered twice and slid by half its width, so the loop
 * never shows a gap.
 */
export async function ShopStrip() {
  const t = await getTranslations("shop");

  const run = (
    <span className="flex shrink-0 items-center gap-6 pr-6">
      <span className="font-medium text-accent">{t("label")}</span>
      <span aria-hidden="true" className="text-gold">✦</span>
      {SHOP.lines.map((line) => (
        <span key={line} className="flex items-center gap-6">
          <span>{line}</span>
          <span aria-hidden="true" className="text-gold">·</span>
        </span>
      ))}
      <span className="flex items-center gap-1.5 font-mono">
        <WhatsAppIcon size={13} />
        {SHOP.phone}
      </span>
      <span aria-hidden="true" className="text-gold">✦</span>
    </span>
  );

  return (
    <div className="border-b border-border/60 bg-surface">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-2 py-1.5 pl-5 pr-3 sm:px-8">
        <a
          href={SHOP.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t("label")}: ${SHOP.lines.join(", ")}`}
          className="group relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)] motion-reduce:overflow-x-auto"
        >
          <span className="flex w-max animate-marquee text-[11px] leading-6 tracking-wide whitespace-nowrap text-foreground/80 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {run}
            <span aria-hidden="true" className="flex motion-reduce:hidden">
              {run}
            </span>
          </span>
        </a>
        <a
          href={SHOP.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("whatsappLabel", { phone: SHOP.phone })}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#1f8f4e] px-3.5 text-xs font-medium text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
        >
          <WhatsAppIcon />
          {t("whatsapp")}
        </a>
      </div>
    </div>
  );
}
