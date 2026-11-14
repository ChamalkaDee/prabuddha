import { Link } from "@/i18n/navigation";
import { BookCover } from "@/components/book-cover";
import { BookBanner } from "@/components/book-banner";

export type CardBook = {
  id: string;
  shelfMark: string;
  title: string;
  author: string;
  cover: string | null;
  available: boolean;
  /** Copies on the shelf right now, out of the total held. */
  copiesFree: number;
  copies: number;
  pinned: boolean;
  bannerText: string | null;
  bannerColor: string | null;
};

/** Cover on top, title and author underneath; the whole card opens the book. */
export function BookCard({
  book,
  priority,
  onLoanLabel,
  copiesLabel,
  pinnedLabel,
}: {
  book: CardBook;
  priority?: boolean;
  onLoanLabel: string;
  copiesLabel: string;
  pinnedLabel: string;
}) {
  return (
    <Link href={`/books/${book.id}`} className="group block">
      <BookCover
        url={book.cover}
        shape="square"
        sizes="(min-width: 640px) 180px, 31vw"
        priority={priority}
        className="transition-transform duration-200 group-active:scale-[0.98]"
      >
        {!book.available ? (
          <span className="absolute top-1.5 left-1.5 z-10 rounded-full border border-border bg-surface/90 px-2 py-1 text-[10px] leading-none text-muted backdrop-blur">
            {onLoanLabel}
          </span>
        ) : book.copies > 1 ? (
          <span className="absolute top-1.5 left-1.5 z-10 rounded-full border border-border bg-surface/90 px-2 py-1 font-mono text-[10px] leading-none text-accent backdrop-blur">
            {copiesLabel}
          </span>
        ) : null}
        {book.pinned && (
          <span
            title={pinnedLabel}
            className="absolute top-1.5 right-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-contrast shadow"
          >
            <PinIcon />
            <span className="sr-only">{pinnedLabel}</span>
          </span>
        )}
        {book.bannerText && <BookBanner text={book.bannerText} color={book.bannerColor} />}
      </BookCover>
      <p className="mt-2 line-clamp-2 font-display text-[13px] leading-snug text-foreground group-hover:text-accent sm:text-[15px]">
        {book.title}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-muted sm:text-xs">{book.author}</p>
    </Link>
  );
}

export function PinIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 3h6l-1 6 4 4H6l4-4-1-6Zm3 10v8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
