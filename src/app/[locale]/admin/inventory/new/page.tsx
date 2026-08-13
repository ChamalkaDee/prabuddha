import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createBook } from "@/actions/books";
import { Input, Textarea, Label, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { locales, localeNames, type Locale } from "@/i18n/routing";

export default async function NewBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const { error } = await searchParams;
  const t = await getTranslations("admin");

  return (
    <div className="max-w-xl">
      <Link href="/admin/inventory" className="eyebrow">
        ← {t("tabInventory")}
      </Link>
      <h2 className="mt-3 font-display text-2xl font-semibold">{t("addBook")}</h2>

      {error && (
        <p className="mt-5 rounded-2xl bg-alert/12 px-5 py-4 text-xs text-alert">
          {error}
        </p>
      )}

      <form action={createBook} className="mt-7 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shelfMark">{t("shelfMark")}</Label>
            <Input id="shelfMark" name="shelfMark" required placeholder="PR-001" />
          </div>
          <div>
            <Label htmlFor="pageCount">{t("pageCount")}</Label>
            <Input id="pageCount" name="pageCount" type="number" min="1" />
          </div>
        </div>

        <div>
          <Label htmlFor="author">{t("author")}</Label>
          <Input id="author" name="author" required />
        </div>

        <div className="card p-5">
          <p className="eyebrow">{t("translationsHint")}</p>
          <div className="mt-5 space-y-7">
            {locales.map((code) => (
              <div key={code} className="space-y-3">
                <p className="text-sm text-accent">{localeNames[code]}</p>
                <div>
                  <Label htmlFor={`title_${code}`}>{t("titleField")}</Label>
                  <Input id={`title_${code}`} name={`title_${code}`} lang={code} />
                </div>
                <div>
                  <Label htmlFor={`description_${code}`}>
                    {t("descriptionField")}
                  </Label>
                  <Textarea
                    id={`description_${code}`}
                    name={`description_${code}`}
                    lang={code}
                  />
                </div>
                <div>
                  <Label htmlFor={`authorBio_${code}`}>{t("authorBioField")}</Label>
                  <Textarea
                    id={`authorBio_${code}`}
                    name={`authorBio_${code}`}
                    lang={code}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <fieldset className="card p-5">
          <legend className="eyebrow px-1">{t("photos")}</legend>
          <div className="mt-4">
            <ImageUpload />
          </div>

          <details className="mt-5">
            <summary className="cursor-pointer text-[11px] text-muted">
              {t("orPasteUrls")}
            </summary>
            <div className="mt-3 space-y-3">
              {[0, 1].map((i) => (
                <Input
                  key={i}
                  name="imageUrl"
                  type="url"
                  placeholder={i === 0 ? t("frontCover") : t("optional")}
                />
              ))}
            </div>
          </details>
        </fieldset>

        <fieldset className="card p-5">
          <legend className="eyebrow px-1">{t("showOnListing")}</legend>
          <div className="mt-3 space-y-4 text-xs">
            <label className="flex items-center gap-3">
              <Checkbox name="showDescription" defaultChecked />
              {t("descriptionField")}
            </label>
            <label className="flex items-center gap-3">
              <Checkbox name="showPageCount" defaultChecked />
              {t("pageCount")}
            </label>
            <label className="flex items-center gap-3">
              <Checkbox name="showAuthorBio" />
              {t("authorBioField")}
            </label>
            <label className="flex items-center gap-3">
              <Checkbox name="visible" defaultChecked />
              {t("visible")}
            </label>
          </div>
        </fieldset>

        <Button type="submit" className="w-full">
          {t("save")}
        </Button>
      </form>
    </div>
  );
}
