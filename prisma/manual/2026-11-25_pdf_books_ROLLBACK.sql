-- ROLLBACK for 2026-11-25_pdf_books.sql
--
-- Removes ONLY the PDF books table. Books, covers, translations, loans,
-- members and categories are not touched.
--
-- Roll the CODE back first, then run this. The uploaded files stay in the
-- `pdf-books` storage bucket; delete the bucket in Supabase → Storage if
-- you want them gone too.

BEGIN;
DROP TABLE IF EXISTS "PdfBook";
COMMIT;
