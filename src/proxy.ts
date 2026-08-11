import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

/**
 * Language routing only. Admin access is checked in the admin layout,
 * because Auth.js database sessions need Prisma, which cannot run in
 * the edge middleware runtime.
 */
export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
