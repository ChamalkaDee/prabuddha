# Prabuddha — deployment guide 📚

> Trilingual build: Sinhala (default), English, Italian. Every URL carries a
> locale prefix — `/si`, `/en`, `/it` — and a visitor with no prefix is sent
> to `/si`.

From zip file to `prabudda-books.vercel.app`. Follow it top to bottom; each step
assumes the one before it worked.

Set aside about 90 minutes for the first run. Roughly half of that is waiting on
Google's OAuth screen and Resend's DNS checks.

---

## What you are building

| Piece | Doing what | Cost |
| --- | --- | --- |
| Vercel | Hosts the Next.js app | Free (Hobby) |
| Supabase | PostgreSQL database | Free |
| Google Cloud | "Continue with Google" sign-in | Free |
| Resend | Sign-in links + loan emails | Free to 3,000/month |

**Total: £0/month** at your scale.

---

## Step 0 — Check what you have 🧰

Open Terminal and run each line. You need all three.

```bash
node -v     # must be v20 or higher
npm -v
git --version
```

If Node is missing or too old, install it from <https://nodejs.org> (take the
LTS build), then close and reopen Terminal.

You also need accounts on: [GitHub](https://github.com),
[Vercel](https://vercel.com), [Supabase](https://supabase.com),
[Resend](https://resend.com), and a Google account. Sign up for all of them now
so you are not interrupted later.

---

## Step 1 — Unpack the project 📦

1. Download `prabuddha.zip` and move it to your home folder.
2. In Terminal:

```bash
cd ~
unzip prabuddha.zip
cd prabuddha
ls
```

You should see `package.json`, `prisma`, `src`, and `DEPLOYMENT.md`. If `ls`
shows nothing but a `prabuddha` folder, run `cd prabuddha` once more.

3. Install the dependencies. This pulls about 400MB and takes a few minutes.

```bash
npm install
```

The `postinstall` script runs `prisma generate` automatically. You may see a
warning about a missing database connection — that is expected at this stage
and harmless.

---

## Step 2 — Create the database on Supabase 🗄️

1. Go to <https://supabase.com/dashboard> and click **New project**.
2. Fill in:
   - **Name:** `prabuddha`
   - **Database Password:** click Generate, then **copy it somewhere safe now**.
     Supabase will not show it again.
   - **Region:** `West EU (London)` — closest to you and to your members.
3. Click **Create new project** and wait about two minutes for it to spin up.
4. Once ready, click **Connect** at the top of the dashboard.
5. Choose the **ORMs** tab, then **Prisma**. You will see two strings.

Copy both. They look like this:

```
DATABASE_URL="postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"
```

Replace `[YOUR-PASSWORD]` in both with the password from step 2.

> **Why two URLs?** Port 6543 is the connection pooler — serverless functions
> open and close connections constantly and would exhaust a direct Postgres
> connection pool. Port 5432 is the direct link, which migrations need because
> they run DDL the pooler cannot handle.

---

## Step 3 — Set up Google sign-in 🔑

1. Go to <https://console.cloud.google.com>.
2. Top-left project dropdown → **New Project** → name it `prabuddha` → **Create**.
3. Make sure the new project is selected in that dropdown.
4. In the search bar type **OAuth consent screen** and open it.
5. Choose **External** → **Create**, then fill in:
   - App name: `Prabuddha Library`
   - User support email: your email
   - Developer contact email: your email
6. Click **Save and Continue** through Scopes and Test Users without adding
   anything. You only need the default email and profile scopes, so Google does
   **not** require a verification review.
7. On the summary page click **Publish app** → **Confirm**. Skip this and only
   100 people can ever sign in.
8. Now go to **Credentials** → **Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**
   - Name: `Prabuddha web`
   - **Authorised JavaScript origins** — add both:
     ```
     http://localhost:3000
     https://prabudda-books.vercel.app
     ```
   - **Authorised redirect URIs** — add both:
     ```
     http://localhost:3000/api/auth/callback/google
     https://prabudda-books.vercel.app/api/auth/callback/google
     ```
9. Click **Create**. Copy the **Client ID** and **Client secret**.

> These redirect URIs must match character for character, including `https` and
> the absence of a trailing slash. A mismatch is the single most common cause of
> `redirect_uri_mismatch` later.

---

## Step 4 — Set up email with Resend 📧

1. Sign up at <https://resend.com>.
2. Go to **API Keys** → **Create API Key**. Name it `prabuddha`, permission
   **Sending access**. Copy the key — it is shown once.
3. Go to **Domains** → **Add Domain** and enter a domain you own, e.g.
   `energi-x.co.uk`. Resend gives you DNS records (SPF, DKIM, and a return-path).
   Add them at your DNS host, then click **Verify**. Propagation usually takes
   10–30 minutes.

If you would rather not set up a domain today, skip step 3 and use
`onboarding@resend.dev` as your sender. It works immediately but **only delivers
to your own Resend account email**, so no one else will receive sign-in links.
Fine for testing, not for going live.

---

## Step 5 — Fill in your local environment file ⚙️

```bash
cp .env.example .env
open -e .env
```

Fill in every value:

| Variable | Where it came from |
| --- | --- |
| `DATABASE_URL` | Step 2, the pooled 6543 string |
| `DIRECT_URL` | Step 2, the direct 5432 string |
| `AUTH_SECRET` | Generate it — see below |
| `NEXTAUTH_URL` | Leave as `http://localhost:3000` for now |
| `AUTH_GOOGLE_ID` | Step 3, Client ID |
| `AUTH_GOOGLE_SECRET` | Step 3, Client secret |
| `AUTH_RESEND_KEY` | Step 4, API key |
| `EMAIL_FROM` | e.g. `library@energi-x.co.uk` |
| `SUPER_ADMIN_EMAILS` | Already set to your two addresses |
| `SHOP_DETAILS` | The shop's address and opening hours |
| `CRON_SECRET` | Generate it — see below |

Generate the two secrets:

```bash
npx auth secret          # prints AUTH_SECRET, paste it in
openssl rand -hex 32     # use this output for CRON_SECRET
```

Save and close the file. `.env` is already in `.gitignore`, so it will never be
committed.

---

## Step 6 — Create the tables and seed the data 🌱

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

`migrate dev` creates every table and writes a migration file into
`prisma/migrations/`. Commit that folder — production replays it.

The seed makes your two super-admin accounts and adds three books so the shelf
is not empty on first load.

Check it worked:

```bash
npx prisma studio
```

A browser tab opens showing your tables. You should see two rows in `User` and
three in `Book`. Close it with `Ctrl+C` in Terminal.

---

## Step 7 — Run it locally ▶️

```bash
npm run dev
```

Open <http://localhost:3000>. Work through this checklist before deploying:

- [ ] `localhost:3000` redirects to `localhost:3000/si` and shows Sinhala
- [ ] Sinhala renders as script, not empty boxes (if boxes: the Google Fonts
      request is being blocked — check the network tab)
- [ ] The language switcher moves you between `/si`, `/en` and `/it` while
      staying on the same page
- [ ] **Sign in** → **Continue with Google** signs you in
- [ ] An **Admin** link appears in the header (proves the super-admin rule fired)
- [ ] **Admin → Members** lists you as `paid`
- [ ] **Admin → Inventory → Add a book** saves a new title — fill in at least
      one language's title; the others can stay blank
- [ ] A book with only an English title still appears when browsing in Sinhala,
      tagged as not yet translated
- [ ] Borrowing a book from its detail page works and it appears in **My loans**

If Google sign-in throws `redirect_uri_mismatch`, go back to Step 3.8 and
compare the URI character by character.

Stop the server with `Ctrl+C`.

---

## Step 8 — Push to GitHub 🐙

```bash
git init
git add .
git commit -m "Prabuddha: initial build"
```

Create an empty repo at <https://github.com/new> named `prabuddha`. Do **not**
tick "Add a README". Then:

```bash
git remote add origin git@github.com:ChamalkaDee/prabuddha.git
git branch -M main
git push -u origin main
```

Go to the repo page and confirm `.env` is **not** listed. If it is, stop and
rotate every secret before continuing.

---

## Step 9 — Deploy to Vercel 🚀

1. Go to <https://vercel.com/new>.
2. Import the `prabuddha` repository.
3. **Before clicking Deploy**, set the project name to **`prabudda-books`** —
   this is what gives you `prabudda-books.vercel.app`.
4. Expand **Environment Variables** and add every line from your `.env` file,
   with two changes:
   - `NEXTAUTH_URL` becomes `https://prabudda-books.vercel.app`
   - everything else is copied across unchanged
5. Click **Deploy** and wait two to three minutes.

> Adding the variables before the first deploy saves you a failed build. If you
> forget, add them under **Settings → Environment Variables** and then
> **Deployments → ⋯ → Redeploy**.

---

## Step 10 — Point the database at production 🔗

Migrations do not run automatically. From your local Terminal, with `.env` still
pointing at the same Supabase project:

```bash
npx prisma migrate deploy
```

Because local and production share one database, the tables are already there
from Step 6 — this command confirms it and is what you will run after every
future schema change.

---

## Step 11 — Final checks ✅

Open <https://prabudda-books.vercel.app>.

- [ ] The catalogue loads
- [ ] Google sign-in works on the live domain
- [ ] The Admin link appears for you
- [ ] Open it on your phone — every screen should be usable one-handed
- [ ] Add a real member: **Admin → Members**, enter their Gmail, tick
      "Already paid", then **Add member**
- [ ] Ask them to sign in and confirm they can borrow

Then check the cron: **Vercel → your project → Settings → Cron Jobs**. You
should see `/api/cron/reminders` scheduled daily at 08:00 UTC. Vercel Hobby
allows one cron per day, which is exactly what this uses.

---

## Making changes later 🔁

```bash
# edit files, then
git add .
git commit -m "what changed"
git push
```

Vercel redeploys on every push to `main`. If you changed
`prisma/schema.prisma`, also run:

```bash
npx prisma migrate dev --name describe_your_change
git add . && git commit -m "migration" && git push
npx prisma migrate deploy
```

---

## When something breaks 🔧

**`redirect_uri_mismatch` on Google sign-in**
The URI in Google Cloud does not exactly match. It must be
`https://prabudda-books.vercel.app/api/auth/callback/google` — no trailing
slash, `https` not `http`.

**Sign-in emails never arrive**
Your Resend domain is probably unverified, so Resend only delivers to your own
account address. Check **Resend → Domains**. Also look in spam.

**`npm install` fails with `P1012: The datasource property url is no longer
supported in schema files`**
You are on an older copy of the schema. Prisma 7 moved connection URLs out of
`schema.prisma` entirely. The datasource block should contain only the
provider:

```prisma
datasource db {
  provider = "postgresql"
}
```

Migrations read the URL from `prisma.config.ts`; the running app gets it from
the driver adapter in `src/lib/prisma.ts`.

**`npm install` fails with `PrismaConfigEnvError: Cannot resolve environment
variable: DATABASE_URL`**
`prisma.config.ts` is using Prisma's `env()` helper, which resolves the moment
the config loads — before `.env` exists during install. Use
`process.env.DIRECT_URL` instead and add the `datasource` key only when it has
a value.

**`npm warn allow-scripts — 6 packages have install scripts not yet covered`**
Informational, on npm 12 and later. npm now blocks dependency install scripts
by default as a supply-chain precaution, and lists what it skipped. The install
still succeeded and nothing is broken.

`package.json` already ships an `allowScripts` block approving the six packages
this project needs, so the warning should not appear. If it does — a version
bumped, say — review and approve with:

```bash
npm approve-scripts --allow-scripts-pending
```

Keep the `allowScripts` block in git. It makes Vercel builds deterministic
rather than depending on whichever npm default is current.

**Build fails with `@prisma/client did not initialize yet`**
`prisma generate` did not run. The `build` script already includes it; confirm
`package.json` still reads `"build": "prisma generate && next build"`.

**`Can't reach database server`**
`DATABASE_URL` still contains the literal `[YOUR-PASSWORD]`, or the password
has a special character that needs URL-encoding (`@` becomes `%40`).

**`too many connections`**
`DATABASE_URL` is pointing at port 5432 instead of the pooler on 6543.

**Someone signs in but cannot borrow**
Working as designed. Anyone may browse; borrowing needs an admin to mark them
paid under **Admin → Members**.

---

## What is not built yet 🚧

Being straight with you about the gaps, so nothing surprises you:

- **Image uploads.** The add-book form takes image **URLs**, not file uploads.
  Wiring up Supabase Storage or Vercel Blob is the natural next job.
- **Book and user analytics drill-downs.** The counts are on the inventory and
  member lists, but the per-book popularity ranking and per-user on-time
  percentage screens are not built. Every field they need is already in the
  schema.
- **Editing a book.** You can add, hide, and delete. Editing an existing record
  needs an edit form — closely modelled on `admin/inventory/new/page.tsx`.
- **Admin route protection** happens in `src/app/admin/layout.tsx`, not in
  middleware. That is deliberate: Auth.js database sessions need Prisma, which
  cannot run in Vercel's edge middleware runtime.

## Where the rules live 📐

All the lending rules sit in one file, `src/lib/loans.ts`:

```ts
LOAN_DAYS = 14          // base rental period
EXTENSION_DAYS = 7      // length of the single extension
MAX_EXTENSIONS = 1      // extensions per loan
MAX_ACTIVE_LOANS = 2    // books per member at once
EXTEND_WINDOW_DAYS = 3  // when the Extend button appears
REMINDER_LEAD_DAYS = 3  // when the reminder email goes out
```

Change a number there and the whole app follows — UI, server actions, and emails.


---

## Working in three languages 🌐

**Interface text** lives in `messages/si.json`, `messages/en.json` and
`messages/it.json`. The three files have identical key structures — if you add a
key to one, add it to all three or that language falls back to showing the raw
key. `messages/en.json` is the reference.

**Book text** lives in the database, not those files. Each book has up to three
`BookTranslation` rows, and the add-book form gives you a block per language.
Fill in what you can: a book with only a Sinhala title still shows up for
English and Italian readers, tagged so they know a translation is missing. The
fallback order is set in `src/i18n/routing.ts` and always ends at Sinhala.

**Emails** go out in the member's own language, not the language of whoever
triggered the send. That comes from `User.locale`, set when an admin adds them
and defaulting to Sinhala.

**Typing Sinhala.** Postgres stores it with no configuration — it's UTF-8
throughout. On macOS add the Sinhala keyboard under System Settings → Keyboard →
Input Sources; on iOS it's General → Keyboard → Add New Keyboard. You can also
paste from anywhere.

**A note on my Sinhala.** I wrote the Sinhala strings and the seed book
descriptions, and you're a native speaker while I am not. Please read through
`messages/si.json` before you show this to the group — I'd expect a handful of
phrasings to sound stiff or slightly off, particularly the admin terminology.
It's a five-minute pass and it's the difference between the app sounding
translated and sounding written.

---

## Notes on this build 🔧

- Route protection sits in `src/proxy.ts` (language routing only) and in
  `src/app/[locale]/admin/layout.tsx` (admin access). Next 16 renamed the
  `middleware.ts` convention to `proxy.ts`.
- The design is dark-only. Champagne gold reads as metal on the oxblood
  surface and as beige on anything light, so a light theme would undo the
  thing that makes the palette work.
- The logo in the header is the torch mark alone (`public/logo-mark.png`).
  The wordmark and tagline are live text so they translate and stay crisp.
  The full lockup is used once, on the sign-in screen.


---

## How Prisma 7 is wired here 🔌

This trips people coming from Prisma 6, so it's worth stating plainly.

**`prisma/schema.prisma`** declares the provider and nothing else. Connection
URLs in this file are a hard error in v7.

**`prisma.config.ts`** supplies the URL for migrations, read from `DIRECT_URL`
(port 5432), because migrations run DDL the pooler can't handle. It loads
`.env` itself — the v7 CLI no longer does that for you — and it only sets the
`datasource` key when a URL actually exists, so `prisma generate` still works
during `npm install`.

**`src/lib/prisma.ts`** connects the running app through the `@prisma/adapter-pg`
driver adapter using `DATABASE_URL` (port 6543, pooled). The client is
constructed lazily so `next build` works without a database.

One consequence worth knowing: Supabase's transaction pooler on 6543 doesn't
support prepared statements. `node-postgres` doesn't use them by default, so
this is fine — but if you later add raw queries with named prepared statements,
point them at the direct connection instead.
