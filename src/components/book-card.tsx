import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/field";

export type CardBook = {
  id: string;
  shelfMark: string;
  title: string;
  author: string;
  cover: string | null;
  available: boolean;
};

export async function BookCard({ book }: { book: CardBook }) {
  const t = await getTranslations("book");

  return (
    <Link
      href={`/books/${book.id}`}
      className="card flex items-center gap-4 p-4 transition-colors hover:border-accent/40"
    >
      {book.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.cover}
          alt=""
          loading="lazy"
          className="h-[70px] w-[50px] shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="h-[70px] w-[50px] shrink-0 rounded-xl bg-surface-high" />
      )}

      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] leading-snug text-foreground">
          {book.title}
        </p>
        <p className="mt-1 truncate text-xs text-muted">{book.author}</p>
        <Badge tone={book.available ? "available" : "onloan"} className="mt-2.5">
          {book.available ? t("onShelf") : t("onLoan")}
        </Badge>
      </div>

      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="shrink-0 text-muted"
      >
        <path
          d="m9 6 6 6-6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
