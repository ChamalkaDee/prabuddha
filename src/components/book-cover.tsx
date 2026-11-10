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
 * A 2:3 book cover. Known hosts go through next/image, which serves a
 * phone-sized WebP instead of the 1400px original. Pasted URLs from any
 * other site fall back to a plain <img>, because next/image throws for
 * hosts it was not configured for.
 */
export function BookCover({
  url,
  sizes,
  priority,
  className,
}: {
  url: string | null;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] overflow-hidden rounded-[10px] border border-border bg-surface-high",
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
      {url &&
        (canOptimise(url) ? (
          <Image
            src={url}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ))}
    </div>
  );
}
