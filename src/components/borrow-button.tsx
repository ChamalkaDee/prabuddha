"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { borrowBook, extendLoan } from "@/actions/loans";
import { Button } from "@/components/ui/button";

export function BorrowButton({
  bookId,
  disabled,
  reason,
}: {
  bookId: string;
  disabled?: boolean;
  reason?: string;
}) {
  const t = useTranslations("book");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (disabled) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-5 py-4 text-center text-xs leading-relaxed text-muted">
        {reason}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        className="w-full"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await borrowBook(bookId);
            setMessage(result.message);
          })
        }
      >
        {pending ? t("borrowing") : t("borrow")}
      </Button>
      {message && (
        <p className="text-center text-xs text-muted">{message}</p>
      )}
    </div>
  );
}

export function ExtendButton({ loanId }: { loanId: string }) {
  const t = useTranslations("loans");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await extendLoan(loanId);
            setMessage(result.message);
          })
        }
      >
        {pending ? t("extending") : t("extend")}
      </Button>
      {message && <span className="text-xs text-muted">{message}</span>}
    </div>
  );
}
