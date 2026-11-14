-- Copies, pinning and cover banners for books.
--
-- Run this ONCE in Supabase → SQL Editor before deploying the code that uses
-- these columns. It only ADDS columns with safe defaults: no existing row,
-- image, loan or member is changed or removed, and running it twice is
-- harmless (IF NOT EXISTS).
--
-- Do NOT use `prisma migrate dev` for this change: the repo no longer has
-- its migration history, so Prisma would detect drift and offer to reset
-- (wipe) the database.

BEGIN;

ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "copies"      INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "pinned"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "bannerText"  TEXT;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "bannerColor" TEXT;

CREATE INDEX IF NOT EXISTS "Book_pinned_idx" ON "Book" ("pinned");

COMMIT;

-- Check: every book should now show copies = 1, pinned = false.
-- SELECT "shelfMark", "copies", "pinned", "bannerText" FROM "Book" ORDER BY "createdAt" DESC;
