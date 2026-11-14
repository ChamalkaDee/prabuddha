/**
 * Preset colours for the ribbon an admin can put over a book cover.
 * Presets rather than a free colour picker so every banner stays legible
 * on both light and dark covers.
 */
export const BANNER_COLORS = {
  oxblood: "bg-[#8f3a33] text-[#fbf8f1]",
  gold: "bg-[#c9a227] text-[#2b1714]",
  green: "bg-[#2f7d4a] text-white",
  blue: "bg-[#2b5c9e] text-white",
  orange: "bg-[#d9661f] text-white",
} as const;

export type BannerColor = keyof typeof BANNER_COLORS;

export const DEFAULT_BANNER_COLOR: BannerColor = "oxblood";

/** Longest banner that still fits across a phone-sized square cover. */
export const BANNER_MAX_LENGTH = 40;

export function bannerClass(color: string | null | undefined) {
  return color && color in BANNER_COLORS
    ? BANNER_COLORS[color as BannerColor]
    : BANNER_COLORS[DEFAULT_BANNER_COLOR];
}
