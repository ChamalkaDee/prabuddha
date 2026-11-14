-- ROLLBACK for 2026-11-14_categories.sql
--
-- Removes ONLY the category feature's own tables: the list of categories
-- and which book is tagged with which. Books, covers, translations, loans,
-- members, copies, pins and banners are not touched.
--
-- Order matters: roll the CODE back first (see ROLLBACK.md), then run this.
-- If the category code is still live when these tables disappear, the
-- shelf page will show an error until the code rollback finishes.

BEGIN;
DROP TABLE IF EXISTS "BookCategory";
DROP TABLE IF EXISTS "Category";
COMMIT;
