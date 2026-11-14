"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/access";
import { slugify } from "@/lib/category";

export type CategoryResult = { ok: boolean; message: string };

function names(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim().slice(0, 60);
  return { nameSi: get("nameSi"), nameEn: get("nameEn"), nameIt: get("nameIt") };
}

export async function createCategory(formData: FormData): Promise<CategoryResult> {
  await requireAdmin();
  const e = await getTranslations("errors");
  const { nameSi, nameEn, nameIt } = names(formData);
  if (!nameSi && !nameEn) return { ok: false, message: e("categoryNameMissing") };

  const base = slugify(nameEn || nameSi);
  let slug = base;
  for (let n = 2; await prisma.category.findUnique({ where: { slug } }); n++) {
    slug = `${base}-${n}`;
  }
  const last = await prisma.category.aggregate({ _max: { position: true } });

  await prisma.category.create({
    data: {
      slug,
      nameSi: nameSi || nameEn,
      nameEn: nameEn || nameSi,
      nameIt: nameIt || nameEn || nameSi,
      position: (last._max.position ?? 0) + 1,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "✓" };
}

export async function updateCategory(
  categoryId: string,
  formData: FormData,
): Promise<CategoryResult> {
  await requireAdmin();
  const e = await getTranslations("errors");
  const { nameSi, nameEn, nameIt } = names(formData);
  if (!nameSi && !nameEn) return { ok: false, message: e("categoryNameMissing") };

  // The slug is left alone so shared shelf links keep working.
  await prisma.category.update({
    where: { id: categoryId },
    data: {
      nameSi: nameSi || nameEn,
      nameEn: nameEn || nameSi,
      nameIt: nameIt || nameEn || nameSi,
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "✓" };
}

/** Removes the category and its tags. The books themselves are untouched. */
export async function deleteCategory(categoryId: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/", "layout");
}
