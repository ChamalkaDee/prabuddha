import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type Viewer = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
  status: "PENDING" | "ACTIVE" | "REVOKED";
  locale: string | null;
};

/** Returns the signed-in member, or null for guests. Guests may browse. */
export async function getViewer(): Promise<Viewer | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      status: true,
      locale: true,
    },
  });
  return user as Viewer | null;
}

export function isAdmin(viewer: Viewer | null) {
  return viewer?.role === "ADMIN" || viewer?.role === "SUPER_ADMIN";
}

/** Approved + paid. Only these members can borrow. */
export function canBorrow(viewer: Viewer | null) {
  return viewer?.status === "ACTIVE";
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!isAdmin(viewer)) redirect("/");
  return viewer as Viewer;
}

export async function requireSuperAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (viewer?.role !== "SUPER_ADMIN") redirect("/admin");
  return viewer;
}
