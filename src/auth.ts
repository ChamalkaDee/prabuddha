import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/** Emails that always get full admin rights on first sign-in. */
export const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  // next-intl middleware rewrites these to the visitor's locale prefix.
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
  },
  providers: [
    Google({
      // The admin pre-creates member rows by email before anyone signs in, so
      // Google needs to attach to that existing row. Safe here because Google
      // only asserts verified addresses — do not copy this to an unverified
      // email provider.
      allowDangerousEmailAccountLinking: true,
    }),
    Resend({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: string }).role ?? "MEMBER";
        session.user.status = (user as { status?: string }).status ?? "PENDING";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const email = user.email?.toLowerCase();
      if (!email || !SUPER_ADMIN_EMAILS.includes(email)) return;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          paidAt: new Date(),
        },
      });
    },
  },
});
