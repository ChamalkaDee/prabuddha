import { Link } from "@/i18n/navigation";
import { BookCover } from "@/components/book-cover";

export type CardBook = {
  id: string;
  shelfMark: string;
  title: string;
  author: string;
  cover: string | null;
  available: boolean;
};

/** Cover on top, title and author underneath; the whole card opens the book. */
export function BookCard({
  book,
  priority,
  onLoanLabel,
}: {
  book: CardBook;
  priority?: boolean;
  onLoanLabel: string;
}) {
  return (
    <Link href={`/books/${book.id}`} className="group block">
      <div className="relative">
        <BookCover
          url={book.cover}
          shape="square"
          sizes="(min-width: 640px) 180px, 31vw"
          priority={priority}
          className="transition-transform duration-200 group-active:scale-[0.98]"
        />
        {!book.available && (
          <span className="absolute top-1.5 left-1.5 rounded-full border border-border bg-surface/90 px-2 py-1 text-[10px] leading-none text-muted backdrop-blur">
            {onLoanLabel}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 font-display text-[13px] leading-snug text-foreground group-hover:text-accent sm:text-[15px]">
        {book.title}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-muted sm:text-xs">{book.author}</p>
    </Link>
  );
}
