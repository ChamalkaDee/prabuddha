import Image from "next/image";
import { cn } from "@/lib/utils";

/** Hosts listed under images.remotePatterns in next.config.ts. */
const OPTIMISED_HOSTS = [
  /\.supabase\.co$/,
  /^lh3\.googleusercontent\.com$/,
  /^books\.google\.com$/,
  /^covers\.openlibrary\.org$/,
];

function canOptimise(url: string) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && OPTIMISED_HOSTS.some((host) => host.test(hostname));
  } catch {
    return false;
  }
}

/**
 * A book cover, square in the shelf grid and 2:3 on the book page. In the
 * square the whole cover is shown (contain, not crop) over a blurred copy
 * of itself, so portrait covers keep their edges without grey bars. The
 * backdrop uses the same src and sizes, so it costs no extra download. Known hosts go through next/image, which serves a
 * phone-sized WebP instead of the 1400px original. Pasted URLs from any
 * other site fall back to a plain <img>, because next/image throws for
 * hosts it was not configured for.
 */
export function BookCover({
  url,
  sizes,
  priority,
  shape = "portrait",
  className,
  children,
}: {
  url: string | null;
  shape?: "square" | "portrait";
  sizes: string;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const fit = shape === "square" ? "object-contain" : "object-cover";
  return (
    <div
      className={cn(
        shape === "square" ? "aspect-square" : "aspect-[2/3]",
        "relative overflow-hidden rounded-[10px] border border-border bg-surface-high",
        className,
      )}
    >
      {!url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo-mark.png"
          alt=""
          className="absolute inset-0 m-auto w-1/3 opacity-25"
        />
      )}
      {url && shape === "square" && (
        <CoverImage
          url={url}
          sizes={sizes}
          priority={priority}
          className="scale-110 object-cover opacity-60 blur-md"
        />
      )}
      {url && <CoverImage url={url} sizes={sizes} priority={priority} className={fit} />}
      {children}
    </div>
  );
}

function CoverImage({
  url,
  sizes,
  priority,
  className,
}: {
  url: string;
  sizes: string;
  priority?: boolean;
  className: string;
}) {
  return canOptimise(url) ? (
    <Image src={url} alt="" fill sizes={sizes} priority={priority} className={className} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("absolute inset-0 h-full w-full", className)}
    />
  );
}
