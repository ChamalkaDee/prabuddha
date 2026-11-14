import { bannerClass } from "@/lib/banner";
import { cn } from "@/lib/utils";

/** The admin's highlighted ribbon, laid across the bottom of a cover. */
export function BookBanner({
  text,
  color,
  size = "sm",
}: {
  text: string;
  color: string | null;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-10 line-clamp-2 text-center font-semibold tracking-wide uppercase shadow-[0_-2px_8px_rgb(0_0_0/0.18)]",
        size === "sm"
          ? "px-1.5 py-1 text-[9px] leading-tight sm:text-[11px]"
          : "px-3 py-2 text-xs leading-tight",
        bannerClass(color),
      )}
    >
      {text}
    </span>
  );
}
