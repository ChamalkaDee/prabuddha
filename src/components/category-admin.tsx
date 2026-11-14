"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createCategory, deleteCategory, updateCategory } from "@/actions/categories";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { localeNames } from "@/i18n/routing";

type Names = { nameSi: string; nameEn: string; nameIt: string };

function NameFields({ values }: { values?: Names }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Input name="nameSi" lang="si" placeholder={localeNames.si} defaultValue={values?.nameSi} />
      <Input name="nameEn" lang="en" placeholder={localeNames.en} defaultValue={values?.nameEn} />
      <Input name="nameIt" lang="it" placeholder={localeNames.it} defaultValue={values?.nameIt} />
    </div>
  );
}

export function NewCategoryForm() {
  const t = useTranslations("admin");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        start(async () => {
          const result = await createCategory(formData);
          if (result.ok) formRef.current?.reset();
          setMessage(result.ok ? null : result.message);
        });
      }}
    >
      <NameFields />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("addCategory")}
        </Button>
        {message && <span className="text-[11px] text-alert">{message}</span>}
      </div>
    </form>
  );
}

export function CategoryEditor({
  category,
  bookCount,
}: {
  category: Names & { id: string };
  bookCount: number;
}) {
  const t = useTranslations("admin");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        start(async () => {
          const result = await updateCategory(category.id, formData);
          setMessage(result.ok ? t("saved") : result.message);
        });
      }}
    >
      <p className="font-mono text-[10px] text-muted">{t("booksInCategory", { count: bookCount })}</p>
      <NameFields values={category} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {t("saveChanges")}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(t("deleteCategoryConfirm"))) return;
            start(async () => void (await deleteCategory(category.id)));
          }}
        >
          {t("delete")}
        </Button>
        {message && <span className="text-[11px] text-muted">{message}</span>}
      </div>
    </form>
  );
}
