import Link from "next/link";
import { notFound } from "next/navigation";
import { AIInsight } from "@/components/AIInsight";
import { TaxTable } from "@/components/TaxTable";
import { getGradientClass } from "@/lib/gradient";
import {
  findBySlug,
  getAllHscodes,
  getRelatedByChapter,
  hasHscodeData
} from "@/lib/hscode";
import { getLocaleStrings, isLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: { lang: string; slug: string };
};

export const generateStaticParams = () => {
  if (!hasHscodeData()) return [];
  const data = getAllHscodes();
  return data.flatMap((item) => [
    { lang: "vi", slug: item.slug },
    { lang: "en", slug: item.slug }
  ]);
};

export const generateMetadata = ({ params }: PageProps) => {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const item = findBySlug(params.slug);
  if (!item) return {};

  const title =
    lang === "en"
      ? `Import Duty for ${item.name_en} (${item.hs_code}) to Vietnam 2026`
      : `Thuế Nhập khẩu ${item.name_vi} (${item.hs_code}) năm 2026`;
  const description =
    lang === "en"
      ? `HS code ${item.hs_code} duties, MFN and EVFTA rates, plus a quick AI insight for ${item.name_en}.`
      : `Mã HS ${item.hs_code} gồm thuế MFN, EVFTA và gợi ý AI cho ${item.name_vi}.`;

  const canonical = `/${lang}/hs-code/${item.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/hs-code/${item.slug}`,
        vi: `/vi/hs-code/${item.slug}`
      }
    }
  };
};

export default function DetailPage({ params }: PageProps) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const strings = getLocaleStrings(lang);

  if (!hasHscodeData()) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          {strings.notFound}
        </h1>
        <p className="mt-3 text-slate-600">
          {lang === "en"
            ? "Run the data processing script to generate the HS code database."
            : "Hãy chạy script xử lý dữ liệu để tạo cơ sở dữ liệu mã HS."}
        </p>
      </main>
    );
  }

  const item = findBySlug(params.slug);
  if (!item) notFound();

  const related = getRelatedByChapter(item.hs_code).filter(
    (entry) => entry.slug !== item.slug
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="bg-brand-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-300">
            {lang === "en" ? "Tariff Dashboard" : "Bảng điều khiển thuế"}
          </div>
          <h1 className="text-2xl font-semibold md:text-3xl">
            {lang === "en"
              ? `${item.name_en} (${item.hs_code})`
              : `${item.name_vi} (${item.hs_code})`}
          </h1>
          <p className="text-sm text-slate-300">
            {lang === "en" ? item.name_vi : item.name_en}
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {lang === "en" ? "Import Duty (MFN)" : "Thuế nhập khẩu (MFN)"}
            </div>
            <div
              className={`mt-3 text-3xl font-semibold ${
                item.taxes?.mfn?.replace(/\s/g, "") === "0%" ? "text-emerald-600" : "text-slate-900"
              }`}
            >
              {item.taxes?.mfn || strings.checkPolicy}
            </div>
            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {lang === "en" ? "Base Duty (NK TT)" : "Thuế cơ bản (NK TT)"}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-800">
                {item.taxes?.nk_tt || strings.checkPolicy}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {strings.vat}
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900">
              {item.vat || strings.notAvailable}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {strings.unit}
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900">
              {item.unit || strings.notAvailable}
            </div>
          </div>
        </div>

        <TaxTable lang={lang} taxes={item.taxes} />

        <AIInsight hs_code={item.hs_code} name_en={item.name_en} lang={lang} />

        {related.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {strings.relatedTitle}
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {related.slice(0, 8).map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/${lang}/hs-code/${entry.slug}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm hover:bg-slate-50"
                >
                  <div className="font-semibold text-slate-900">
                    {entry.hs_code}
                  </div>
                  <div className="text-slate-600">
                    {lang === "en" ? entry.name_en : entry.name_vi}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
