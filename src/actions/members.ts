"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/access";

export type ActionResult = { ok: boolean; message: string };

const MAX_CO_ADMINS = 3;

export async function addMember(formData: FormData): Promise<void> {
  await requireAdmin();
  const [e, locale] = await Promise.all([getTranslations("errors"), getLocale()]);
  const base = `/${locale}/admin/members`;

  const parsed = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!parsed.success) {
    redirect(`${base}?error=${encodeURIComponent(e("emailInvalid"))}`);
  }
  const email = parsed.data;
  const markPaid = formData.get("markPaid") === "on";

  if (await prisma.user.findUnique({ where: { email } })) {
    redirect(`${base}?error=${encodeURIComponent(e("emailListed"))}`);
  }

  await prisma.user.create({
    data: {
      email,
      locale,
      status: markPaid ? "ACTIVE" : "PENDING",
      paidAt: markPaid ? new Date() : null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/", "layout");
  redirect(`${base}?added=${encodeURIComponent(email)}`);
}

export async function setPaidStatus(
  userId: string,
  paid: boolean,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: paid ? "ACTIVE" : "PENDING",
      paidAt: paid ? new Date() : null,
      approvedById: admin.id,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "✓" };
}

export async function setRole(
  userId: string,
  role: "ADMIN" | "MEMBER",
): Promise<ActionResult> {
  await requireSuperAdmin();
  const e = await getTranslations("errors");

  if (role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins >= MAX_CO_ADMINS) {
      return { ok: false, message: e("adminLimit", { max: MAX_CO_ADMINS }) };
    }
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (target?.role === "SUPER_ADMIN") {
    return { ok: false, message: e("superAdminProtected") };
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/", "layout");
  return { ok: true, message: "✓" };
}

export async function revokeMember(userId: string): Promise<ActionResult> {
  await requireAdmin();
  const e = await getTranslations("errors");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { loans: { where: { status: "ACTIVE" } } },
  });
  if (target?.role === "SUPER_ADMIN") {
    return { ok: false, message: e("superAdminProtected") };
  }
  if (target && target.loans.length > 0) {
    return { ok: false, message: e("returnBooksFirst") };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "REVOKED", paidAt: null },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "✓" };
}
