import { defineConfig } from "prisma/config";

/**
 * Prisma 7 no longer reads .env automatically. Wrapped in try/catch because
 * there is no .env during `npm install` or on Vercel, where the variables
 * come from the environment directly.
 */
try {
  process.loadEnvFile(".env");
} catch {
  // No .env file — that is fine.
}

/**
 * Migrations connect directly (port 5432), not through the pooler, because
 * they run DDL the pooler cannot handle.
 *
 * The key is added only when a URL exists. Prisma's own env() helper throws
 * the moment the config loads, which breaks `prisma generate` during
 * `npm install` before .env is written.
 */
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
