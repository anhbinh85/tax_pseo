import { notFound } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { HsSuggest } from "@/components/HsSuggest";
import { getChapterCodes, hasHscodeData } from "@/lib/hscode";
import { getLocaleStrings, isLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: { lang: string };
};

export default function HomePage({ params }: PageProps) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const strings = getLocaleStrings(lang);
  const chapters = hasHscodeData() ? getChapterCodes() : [];

  return (
    <main className="flex min-h-screen flex-col">
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
            Vietnam Import Tax &amp; HS Code Portal 2026
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
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {lang === "en" ? "Fast HS Lookup" : "Tra cứu HS nhanh"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {lang === "en"
                ? "Search by HS code or commodity name to view the 2026 import duties."
                : "Tra cứu mã HS hoặc tên hàng hoá để xem thuế nhập khẩu năm 2026."}
            </p>
            <div className="mt-4">
              <HsSuggest lang={lang} />
            </div>
          </div>

          {chapters.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                {lang === "en" ? "Browse by Chapter" : "Tra cứu theo Chương"}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {chapters.map((chapter) => (
                  <Link
                    key={chapter}
                    href={`/${lang}/chapter/${chapter}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-red hover:bg-white"
                  >
                    {lang === "en" ? `Chapter ${chapter}` : `Chương ${chapter}`}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
