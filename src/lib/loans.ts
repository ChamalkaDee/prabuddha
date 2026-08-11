/**
 * The lending rules, in one place. Change them here and the whole app follows.
 */
export const LOAN_DAYS = 14;
export const EXTENSION_DAYS = 7;
export const MAX_EXTENSIONS = 1;
export const MAX_ACTIVE_LOANS = 2;
/** The "Extend loan" button appears this many days before the due date. */
export const EXTEND_WINDOW_DAYS = 3;
/** Reminder email goes out this many days before the due date. */
export const REMINDER_LEAD_DAYS = 3;

export function addDays(from: Date, days: number) {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

export function dueDateFrom(start: Date = new Date()) {
  return addDays(start, LOAN_DAYS);
}

export function canExtend(loan: {
  dueAt: Date;
  extensionCount: number;
  returnedAt: Date | null;
}) {
  if (loan.returnedAt) return false;
  if (loan.extensionCount >= MAX_EXTENSIONS) return false;
  const daysLeft = Math.ceil((loan.dueAt.getTime() - Date.now()) / 86_400_000);
  return daysLeft <= EXTEND_WINDOW_DAYS;
}

export type LoanHealth = "ok" | "due-soon" | "overdue";

export function loanHealth(dueAt: Date): LoanHealth {
  const daysLeft = Math.ceil((dueAt.getTime() - Date.now()) / 86_400_000);
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= EXTEND_WINDOW_DAYS) return "due-soon";
  return "ok";
}
