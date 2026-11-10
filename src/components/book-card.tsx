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
          sizes="(min-width: 640px) 220px, 46vw"
          priority={priority}
          className="transition-transform duration-200 group-active:scale-[0.98]"
        />
        {!book.available && (
          <span className="absolute top-2 left-2 rounded-full border border-border bg-surface/90 px-2.5 py-1 text-[10px] leading-none text-muted backdrop-blur">
            {onLoanLabel}
          </span>
        )}
      </div>
      <p className="mt-3 line-clamp-2 font-display text-[15px] leading-snug text-foreground group-hover:text-accent">
        {book.title}
      </p>
      <p className="mt-1 truncate text-xs text-muted">{book.author}</p>
    </Link>
  );
}
