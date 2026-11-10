import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Keep these out of the bundle: resend lazily imports an optional React
  // renderer we never use, and Prisma ships its own runtime.
  serverExternalPackages: ["resend", "@prisma/client", "@prisma/adapter-pg", "pg"],
  experimental: {
    serverActions: {
      // The default is 1MB, which two phone photos already exceed, and the
      // request then fails with a bare "server error" page. Photos are
      // shrunk in the browser to a few hundred KB each; 4MB leaves room for
      // four of them while staying under Vercel's 4.5MB request limit.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
    ],
  },
};

export default withNextIntl(nextConfig);
