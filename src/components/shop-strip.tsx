import { getTranslations } from "next-intl/server";

/** Where members collect and return books. Change it here and the strip follows. */
export const SHOP = {
  lines: ["Ceylon Market", "Via Gaspare del Carretto 19B", "37136 Verona", "Italy"],
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

function MapPinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const pill =
  "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background/60 px-4 text-xs text-accent transition-colors hover:border-accent/50 hover:bg-accent-soft";

/**
 * Where to collect and return books: one slim line under the header that
 * opens to show the address (a Google Maps link) and the WhatsApp number.
 * A native <details>, so it works without JavaScript.
 */
export async function ShopStrip() {
  const t = await getTranslations("shop");
  const [name, ...rest] = SHOP.lines;

  return (
    <div className="border-b border-border/60 bg-surface">
      <details className="group mx-auto w-full max-w-3xl px-5 sm:px-8">
        <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-accent [&::-webkit-details-marker]:hidden">
          <MapPinIcon size={14} />
          <span className="eyebrow">{t("label")}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="ml-auto text-muted transition-transform group-open:rotate-180"
          >
            <path
              d="m6 9 6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>

        <div className="flex flex-col gap-3 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={SHOP.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/address min-w-0 text-xs leading-relaxed text-foreground/85 transition-colors hover:text-accent"
          >
            <span className="font-display text-[13px] font-semibold text-foreground group-hover/address:text-accent">
              {name}
            </span>
            <span aria-hidden="true" className="mx-1.5 text-gold">
              ·
            </span>
            {rest.join(", ")}
          </a>

          <div className="flex gap-2">
            <a href={SHOP.mapsUrl} target="_blank" rel="noopener noreferrer" className={pill}>
              <MapPinIcon size={14} />
              {t("openMaps")}
            </a>
            <a
              href={SHOP.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("whatsappLabel", { phone: SHOP.phone })}
              className={pill}
            >
              <span className="text-[#1f8f4e]">
                <WhatsAppIcon size={15} />
              </span>
              <span className="font-mono text-[11px]">{SHOP.phone}</span>
            </a>
          </div>
        </div>
      </details>
    </div>
  );
}
