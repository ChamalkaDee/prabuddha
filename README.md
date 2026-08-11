# Prabuddha

A members' peer-to-peer lending library. Anyone can browse the shelf; members
collect and return books in person at the distributor shop.

**Deployment: see [DEPLOYMENT.md](./DEPLOYMENT.md).**

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 7 ·
Supabase Postgres · Auth.js v5 (Google + email) · next-intl · Resend · Vercel

Trilingual: Sinhala (default), English, Italian. Interface strings live in
`messages/`; book titles and descriptions live in the `BookTranslation` table.

## The rules

Two books per member, 14 days each, one 7-day extension available in the final
three days. Borrowing unlocks only once an admin marks the member as paid.

## Layout

```
prisma/schema.prisma      database schema
prisma/seed.ts            super admins + starter books
src/auth.ts               Auth.js config, super-admin bootstrap
src/lib/loans.ts          every lending rule, in one place
src/lib/access.ts         getViewer / isAdmin / canBorrow guards
src/actions/              server actions (loans, members, books)
src/app/                  routes
src/app/api/cron/         daily due-date reminder
src/i18n/routing.ts       locales, fallback chain, default language
src/lib/book-i18n.ts      picks the best translation per book
messages/{si,en,it}.json  interface strings
src/proxy.ts              language routing (Next 16 middleware convention)
```

## Commands

```bash
npm run dev        # local dev server
npm run build      # prisma generate + next build
npm run db:migrate # create a migration
npm run db:seed    # seed super admins and books
npm run db:studio  # browse the database
```
