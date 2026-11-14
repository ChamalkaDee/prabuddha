"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setPaidStatus, setRole, revokeMember } from "@/actions/members";
import { markReturned } from "@/actions/loans";
import { toggleVisibility, togglePin, deleteBook } from "@/actions/books";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

function useAction() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  return { pending, message, setMessage, start };
}

function Note({ message }: { message: string | null }) {
  if (!message || message === "✓") return null;
  return <span className="text-[11px] text-muted">{message}</span>;
}

export function PaidToggle({ userId, paid }: { userId: string; paid: boolean }) {
  const t = useTranslations("admin");
  const { pending, message, setMessage, start } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={paid ? "outline" : "primary"}
        disabled={pending}
        onClick={() =>
          start(async () => setMessage((await setPaidStatus(userId, !paid)).message))
        }
      >
        {paid ? t("markUnpaid") : t("markPaid")}
      </Button>
      <Note message={message} />
    </div>
  );
}

export function RoleControl({ userId, role }: { userId: string; role: string }) {
  const t = useTranslations("admin");
  const { pending, message, setMessage, start } = useAction();
  if (role === "SUPER_ADMIN") {
    return <span className="text-[11px] text-accent">{t("superAdmin")}</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() =>
          start(async () =>
            setMessage(
              (await setRole(userId, role === "ADMIN" ? "MEMBER" : "ADMIN")).message,
            ),
          )
        }
      >
        {role === "ADMIN" ? t("removeAdmin") : t("makeAdmin")}
      </Button>
      <Note message={message} />
    </div>
  );
}

export function RevokeButton({ userId }: { userId: string }) {
  const t = useTranslations("admin");
  const { pending, message, setMessage, start } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="danger"
        disabled={pending}
        onClick={() => start(async () => setMessage((await revokeMember(userId)).message))}
      >
        {t("revoke")}
      </Button>
      <Note message={message} />
    </div>
  );
}

export function ReturnButton({ loanId }: { loanId: string }) {
  const t = useTranslations("admin");
  const { pending, message, setMessage, start } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        disabled={pending}
        onClick={() => start(async () => setMessage((await markReturned(loanId)).message))}
      >
        {pending ? t("checkingIn") : t("markReturned")}
      </Button>
      <Note message={message} />
    </div>
  );
}

export function BookRowActions({
  bookId,
  visible,
  pinned,
  onLoan,
}: {
  bookId: string;
  visible: boolean;
  pinned: boolean;
  onLoan: boolean;
}) {
  const t = useTranslations("admin");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/admin/inventory/${bookId}/edit`}>
        <Button>{t("edit")}</Button>
      </Link>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => start(async () => void (await toggleVisibility(bookId)))}
      >
        {visible ? t("hide") : t("show")}
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => start(async () => void (await togglePin(bookId)))}
      >
        {pinned ? t("unpin") : t("pin")}
      </Button>
      <Button
        variant="danger"
        disabled={pending || onLoan}
        onClick={() => start(async () => void (await deleteBook(bookId)))}
      >
        {t("delete")}
      </Button>
    </div>
  );
}
