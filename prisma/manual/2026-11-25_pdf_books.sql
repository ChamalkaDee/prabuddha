-- PDF books: one new table for documents anyone can read or download.
--
-- Run ONCE in Supabase → SQL Editor before using the PDF section.
-- It only CREATES a new table. No existing book, image, loan or member row
-- is changed or removed. Safe to run twice (IF NOT EXISTS).
--
-- The files themselves go in the `pdf-books` storage bucket, which the app
-- creates on the first upload.
--
-- Do NOT use `prisma migrate dev` (see 2026-11-14_copies_pin_banner.sql).
-- Undo with 2026-11-25_pdf_books_ROLLBACK.sql.

BEGIN;

CREATE TABLE IF NOT EXISTS "PdfBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "pageCount" INTEGER,
    "coverUrl" TEXT,
    "coverPath" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PdfBook_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PdfBook_visible_idx" ON "PdfBook"("visible");

-- Keep the Supabase REST API out, like every other table
-- (see 2026-11-18_enable_rls.sql). Prisma bypasses RLS.
ALTER TABLE "PdfBook" ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Check: should return one row, rowsecurity = true.
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'PdfBook';
