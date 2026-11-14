# Rolling back the categories change

The categories feature (commit `09eead1`, tag `categories-v1`) can be undone
without touching any book, photo, loan or member. The version before it is
tagged `before-categories`.

## Option A: keep the tables, just go back to the old screens (fastest)

The previous version of the app ignores the category tables, so it runs
fine with them still in the database. Your tags stay saved in case you
change your mind.

1. Vercel → prabuddha → **Deployments**.
2. Find the deployment for commit `8eac956` ("Full covers in square
   thumbnails…"), open its **⋯** menu and choose **Instant Rollback**.

That takes seconds and needs no code change. To make it permanent, so the
next push does not bring categories back, run:

```bash
git revert --no-edit 09eead1
git push
```

## Option B: remove categories completely

1. Do Option A first, both steps, and wait for the deploy to finish.
2. Supabase → SQL Editor → run `2026-11-14_categories_ROLLBACK.sql`.

## Bringing categories back later

- After Option A: `git revert <the revert commit>` and push.
- After Option B: run `2026-11-14_categories.sql` again first (it recreates
  the categories and the suggested tags), then revert the revert and push.
  Any tags you changed by hand after the first run are lost.
