import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { AIInsight } from "@/components/AIInsight";
import { DeepTaxCalculator } from "@/components/DeepTaxCalculator";
import { HsCodePdfButton } from "@/components/HsCodePdfButton";
import { TaxTable } from "@/components/TaxTable";
import { JsonLd, webPageWithBreadcrumb } from "@/components/JsonLd";
import { SITE_YEAR } from "@/lib/site";
import {
  getAllHscodes,
  findBySlug,
  getRelatedByChapter,
  hasHscodeData
} from "@/lib/hscode";
import { getLocaleStrings, isLocale, type Locale } from "@/lib/i18n";

const VN_HS_PREBUILD_LIMIT = 2000;

type PageProps = {
  params: { lang: string; slug: string };
};

export const dynamicParams = true;
export const revalidate = 60 * 60 * 24;

export function generateStaticParams() {
  if (!hasHscodeData()) return [];
  const all = getAllHscodes();
  const slugs = all.slice(0, VN_HS_PREBUILD_LIMIT).map((item) => item.slug);
  return slugs.flatMap((slug) => [
    { lang: "vi", slug },
    { lang: "en", slug }
  ]);
}

export const generateMetadata = ({ params }: PageProps) => {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const item = findBySlug(params.slug);
  if (!item) return {};

  const title =
    lang === "en"
      ? `Import Duty for ${item.name_en} (${item.hs_code}) to Vietnam ${SITE_YEAR}`
      : `Thuế Nhập khẩu ${item.name_vi} (${item.hs_code}) năm ${SITE_YEAR}`;
  const description =
    lang === "en"
      ? `HS code ${item.hs_code} duties, MFN and EVFTA rates, plus a quick AI insight for ${item.name_en} in ${SITE_YEAR}.`
      : `Mã HS ${item.hs_code} gồm thuế MFN, EVFTA và gợi ý AI cho ${item.name_vi} năm ${SITE_YEAR}.`;

  const canonical = `/${lang}/hs-code/${item.slug}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vietnamhs.info";

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/en/hs-code/${item.slug}`,
        vi: `/vi/hs-code/${item.slug}`
      }
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonical}`,
      images: [{ url: "/hero-bg.jpg", width: 1200, height: 630, alt: item.hs_code }],
    },
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

  const formatPercent = (value?: string | null) => {
    if (!value) return strings.checkPolicy;
    const trimmed = value.trim();
    if (!trimmed || trimmed === "*" || trimmed === "-") return trimmed;
    if (trimmed.includes("%")) return trimmed;
    const hasNumber = /\d/.test(trimmed);
    return hasNumber ? `${trimmed}%` : trimmed;
  };

  const parseRate = (value?: string | null) => {
    if (!value) return 0;
    const cleaned = value.replace(",", ".");
    const match = cleaned.match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  };

  const importOptions: Record<string, number> = {
    mfn: parseRate(item.taxes?.mfn),
    nk_tt: parseRate(item.taxes?.nk_tt),
    form_e: parseRate(item.taxes?.form_e),
    form_d: parseRate(item.taxes?.form_d),
    ajcep: parseRate(item.taxes?.ajcep),
    vjepa: parseRate(item.taxes?.vjepa),
    akfta: parseRate(item.taxes?.akfta),
    aanzfta: parseRate(item.taxes?.aanzfta),
    aifta: parseRate(item.taxes?.aifta),
    vkfta: parseRate(item.taxes?.vkfta),
    vcfta: parseRate(item.taxes?.vcfta),
    vn_eaeu: parseRate(item.taxes?.vn_eaeu),
    cptpp: parseRate(item.taxes?.cptpp),
    ahkfta: parseRate(item.taxes?.ahkfta),
    vncu: parseRate(item.taxes?.vncu),
    eur1: parseRate(item.taxes?.eur1),
    ukv: parseRate(item.taxes?.ukv),
    vn_lao: parseRate(item.taxes?.vn_lao),
    vifta: parseRate(item.taxes?.vifta),
    rcept: parseRate(item.taxes?.rcept)
  };

  const exportOptions: Record<string, number> = {
    xk: parseRate(item.export_tax),
    xk_cptpp: parseRate(item.export_cptpp),
    xk_ev: parseRate(item.export_ev),
    xk_ukv: parseRate(item.export_ukv)
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name:
      lang === "en"
        ? `HS Code ${item.hs_code}: ${item.name_en}`
        : `Mã HS ${item.hs_code}: ${item.name_vi}`,
    description:
      lang === "en"
        ? `Import tax rate for ${item.name_en} in Vietnam ${SITE_YEAR}. MFN Rate: ${formatPercent(
            item.taxes?.mfn
          )}.`
        : `Thuế nhập khẩu cho ${item.name_vi} năm ${SITE_YEAR}. Thuế MFN: ${formatPercent(
            item.taxes?.mfn
          )}.`,
    sku: item.hs_code,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Vietnam Import Tax Portal"
      }
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Import Tax (MFN)",
        value: formatPercent(item.taxes?.mfn)
      },
      {
        "@type": "PropertyValue",
        name: "VAT",
        value: formatPercent(item.vat)
      },
      {
        "@type": "PropertyValue",
        name: "Legal Decree",
        value: "26/2023/ND-CP"
      }
    ]
  };

  const infoRows = [
    {
      label: lang === "en" ? "Excise Tax (TTĐB)" : "Thuế TTĐB",
      value: formatPercent(item.excise_tax)
    },
    {
      label: lang === "en" ? "Export Tax (XK)" : "Thuế XK",
      value: formatPercent(item.export_tax)
    },
    {
      label: lang === "en" ? "Export CPTPP" : "XK CPTPP",
      value: formatPercent(item.export_cptpp)
    },
    {
      label: lang === "en" ? "Export EVFTA" : "XK EVFTA",
      value: formatPercent(item.export_ev)
    },
    {
      label: lang === "en" ? "Export UKVFTA" : "XK UKVFTA",
      value: formatPercent(item.export_ukv)
    },
    {
      label:
        lang === "en"
          ? "Environmental Protection Tax"
          : "Thuế BVMT",
      value: formatPercent(item.env_tax)
    },
    {
      label: lang === "en" ? "VAT Reduction" : "Giảm VAT",
      value: formatPercent(item.vat_reduction)
    }
  ].filter((entry) => entry.value && entry.value !== strings.checkPolicy);

  const chapter = item.hs_code.slice(0, 2);
  const pageName = lang === "en" ? `Import Duty for ${item.name_en} (${item.hs_code})` : `Thuế Nhập khẩu ${item.name_vi} (${item.hs_code})`;
  const pageDesc = lang === "en" ? `HS code ${item.hs_code} duties, MFN and EVFTA rates.` : `Mã HS ${item.hs_code} thuế MFN và EVFTA.`;
  const breadcrumbJsonLd = webPageWithBreadcrumb(
    pageName,
    pageDesc,
    `/${lang}/hs-code/${item.slug}`,
    [
      { name: "Home", path: `/${lang}` },
      { name: `Chapter ${chapter}`, path: `/${lang}/chapter/${chapter}` },
      { name: item.hs_code, path: `/${lang}/hs-code/${item.slug}` },
    ]
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <JsonLd data={breadcrumbJsonLd} />
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div id="hs-code-pdf-root">
        <div className="bg-brand-navy text-white" data-pdf-section>
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
            <div>
              <Link
                href={`/${lang}`}
                className="inline-flex items-center justify-center rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-red-700"
              >
                {lang === "en" ? "Home" : "Trang chủ"}
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          <div className="grid gap-4 md:grid-cols-3" data-pdf-section>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {lang === "en" ? "Import Duty (MFN)" : "Thuế nhập khẩu (MFN)"}
              </div>
              <div
                className={`mt-3 text-3xl font-semibold ${
                  item.taxes?.mfn?.replace(/\s/g, "") === "0%" ? "text-emerald-600" : "text-slate-900"
                }`}
              >
                {formatPercent(item.taxes?.mfn)}
              </div>
              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {lang === "en" ? "Base Duty (NK TT)" : "Thuế cơ bản (NK TT)"}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-800">
                  {formatPercent(item.taxes?.nk_tt)}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {strings.vat}
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">
                {formatPercent(item.vat)}
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

          <div data-pdf-section>
            <TaxTable lang={lang} taxes={item.taxes} />
          </div>

          <DeepTaxCalculator
            lang={lang}
            rates={{
              mfn: parseRate(item.taxes?.mfn),
              formE: parseRate(item.taxes?.form_e),
              formD: parseRate(item.taxes?.form_d),
              vat: parseRate(item.vat),
              excise: parseRate(item.excise_tax),
              env: parseRate(item.env_tax),
              importOptions,
              exportOptions
            }}
          />

          <section
            className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm"
            data-pdf-section
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {lang === "en"
                  ? "Additional Taxes & Policy"
                  : "Thuế bổ sung & Chính sách"}
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                {lang === "en" ? "Compliance" : "Tuân thủ"}
              </span>
            </div>
            {infoRows.length === 0 && !item.policy ? (
              <div className="mt-3 text-sm text-slate-600">
                {strings.notAvailable}
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {infoRows.map((entry) => (
                  <div
                    key={entry.label}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {entry.label}
                    </div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">
                      {entry.value}
                    </div>
                  </div>
                ))}
                {item.policy && (
                  <div className="rounded-xl border border-amber-200 bg-white p-4 md:col-span-2 lg:col-span-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {lang === "en"
                        ? "Product Policy by HS Code"
                        : "Chính sách mặt hàng theo mã HS"}
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      {item.policy}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="text-sm text-red-700">
                {lang === "en"
                  ? "Need more clarification on policy or tax treatment? Contact us for details."
                  : "Cần làm rõ thêm về chính sách hoặc thuế suất? Liên hệ để được tư vấn chi tiết."}
              </div>
              <Link
                href={`/${lang}/contact`}
                className="inline-flex items-center justify-center rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              >
                {lang === "en" ? "Contact" : "Liên hệ"}
              </Link>
            </div>
          </section>

          <div data-pdf-section>
            <AIInsight hs_code={item.hs_code} name_en={item.name_en} lang={lang} />
          </div>

          <section
            className="relative overflow-hidden rounded-2xl border-l-4 border-amber-500 bg-amber-50/95 p-6 shadow-lg ring-2 ring-amber-300/60"
            data-pdf-section
            style={{ boxShadow: "0 4px 14px rgba(245, 158, 11, 0.25)" }}
          >
            <div className="absolute right-4 top-4 text-4xl opacity-20" aria-hidden>🇺🇸</div>
            <div className="relative flex flex-wrap items-center gap-3">
              <span className="text-3xl" aria-hidden>🇺🇸</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {lang === "en"
                  ? "US Import Duty (Global Sourcing)"
                  : "Thuế nhập khẩu Mỹ (Nguồn toàn cầu)"}
              </h2>
            </div>
            <p className="relative mt-3 text-base text-slate-700">
              {lang === "en"
                ? `Compare US import duty for ${item.hs_code} from Vietnam vs. China vs. Mexico vs. Korea, EU, UK, Australia.`
                : `So sánh thuế nhập khẩu Mỹ cho ${item.hs_code} từ Việt Nam, Trung Quốc, Mexico, Hàn Quốc, EU, UK, Australia.`}
            </p>
            <Link
              href={`/us-hts/${item.slug}`}
              className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-base font-bold text-amber-950 shadow-lg transition hover:bg-amber-400 hover:shadow-xl"
            >
              <span aria-hidden>🇺🇸</span>
              {lang === "en" ? "US HTS " : "US HTS "}{item.hs_code} →
            </Link>
          </section>

          {related.length > 0 && (
            <section className="space-y-4" data-pdf-section>
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
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-10">
        <HsCodePdfButton lang={lang} item={item} />
      </div>
    </main>
  );
}
