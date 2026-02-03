import { notFound } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { HsSuggest } from "@/components/HsSuggest";
import { CasLookup } from "@/components/CasLookup";
import { BrowseByChapterTabs } from "@/components/BrowseByChapterTabs";
import { JsonLd, webPageWithBreadcrumb } from "@/components/JsonLd";
import { getChapterCodes, hasHscodeData } from "@/lib/hscode";
import { getUsHtsChapterCodes } from "@/lib/hts-chapters";
import { hasUsHtsData } from "@/lib/us-data";
import { getLocaleStrings, isLocale, type Locale } from "@/lib/i18n";
import { SITE_YEAR } from "@/lib/site";

type PageProps = {
  params: { lang: string };
};

export default function HomePage({ params }: PageProps) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const strings = getLocaleStrings(lang);
  const chapters = hasHscodeData() ? getChapterCodes() : [];
  const path = `/${lang}`;
  const jsonLd = webPageWithBreadcrumb(
    strings.homeTitle,
    lang === "en" ? `Search HS codes and import duties in Vietnam for ${SITE_YEAR}.` : `Tra cứu mã HS và thuế nhập khẩu Việt Nam năm ${SITE_YEAR}.`,
    path,
    [{ name: "Home", path }]
  );

  return (
    <main className="flex min-h-screen flex-col">
      <JsonLd data={jsonLd} />
      <section className="relative min-h-[360px] overflow-hidden sm:min-h-[460px]">
        <div className="absolute inset-0">
          <video
            className="hidden h-full w-full object-cover md:block motion-reduce:hidden"
            src="/bg-video.mp4"
            poster="/hero-bg.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <div className="h-full w-full bg-[url('/hero-bg.jpg')] bg-cover bg-center md:hidden motion-reduce:block" />
        </div>
        <div className="absolute inset-0 bg-brand-navy/25" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-20 text-white">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Vietnam Logistics Portal
          </span>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            Vietnam Import Tax &amp; HS Code Portal {SITE_YEAR}
          </h1>
          <p className="text-base text-slate-200 md:text-lg">
            Official Tariff Data • Decree 26/2023 • Decree 174/2025
          </p>
          <SearchBar lang={lang} variant="hero" />
        </div>
      </section>

      <section className="relative overflow-hidden py-12">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-brand-navy/35" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6">
          <div className="rounded-2xl border-2 border-amber-400/80 bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900">
              🇺🇸 US HTS Import Duty Lookup
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {lang === "en"
                ? "Compare US import duty by origin: China vs Vietnam vs Mexico vs EU, UK, Australia, Korea, Japan, Canada, Russia. FTA/preferential rates (e.g. USMCA, KORUS) shown where available; EU/UK/AU may have lower rates—check detail page."
                : "So sánh thuế nhập khẩu Mỹ theo nguồn gốc: Trung Quốc, Việt Nam, Mexico, EU, UK, Australia, Hàn Quốc, Nhật, Canada, Nga. Thuế FTA/ưu đãi (USMCA, KORUS) hiển thị khi có; EU/UK/AU có thể thấp hơn—xem trang chi tiết."}
            </p>
            <Link
              href="/us-hts"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-amber-950 shadow-md transition hover:bg-amber-400"
            >
              Open US HTS Lookup →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {lang === "en" ? "Fast HS Lookup" : "Tra cứu HS nhanh"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {lang === "en"
                ? `Search by HS code or commodity name to view the ${SITE_YEAR} import duties.`
                : `Tra cứu mã HS hoặc tên hàng hoá để xem thuế nhập khẩu năm ${SITE_YEAR}.`}
            </p>
            <div className="mt-4">
              <HsSuggest lang={lang} />
            </div>
            <div className="mt-6">
              <CasLookup lang={lang} />
            </div>
          </div>

          {(chapters.length > 0 || hasUsHtsData()) && (
            <BrowseByChapterTabs
              lang={lang}
              vnChapters={chapters}
              usChapters={hasUsHtsData() ? getUsHtsChapterCodes() : []}
              labels={
                lang === "en"
                  ? {
                      browseByChapter: "Browse by Chapter",
                      chapter: "Chapter",
                      vnHsCode: "VN HS Code",
                      usHts: "US HTS",
                    }
                  : {
                      browseByChapter: "Tra cứu theo Chương",
                      chapter: "Chương",
                      vnHsCode: "Mã HS VN",
                      usHts: "US HTS",
                    }
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}
