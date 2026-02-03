import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllHscodes,
  getChapterCodes,
  hasHscodeData
} from "@/lib/hscode";
import { getLocaleStrings, isLocale, type Locale } from "@/lib/i18n";
import { SITE_YEAR } from "@/lib/site";

type PageProps = {
  params: { lang: string; chapter: string };
};

export const generateStaticParams = () => {
  if (!hasHscodeData()) return [];
  const chapters = getChapterCodes();
  return chapters.flatMap((chapter) => [
    { lang: "vi", chapter },
    { lang: "en", chapter }
  ]);
};

export const generateMetadata = ({ params }: PageProps) => {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const chapter = params.chapter;

  const title =
    lang === "en"
      ? `Import Duties for Chapter ${chapter} (Vietnam ${SITE_YEAR})`
      : `Thuế Nhập khẩu Chương ${chapter} (Việt Nam ${SITE_YEAR})`;
  const description =
    lang === "en"
      ? `Browse HS codes in Chapter ${chapter} with MFN and FTA import duties.`
      : `Danh sách mã HS thuộc Chương ${chapter} và mức thuế nhập khẩu MFN/FTA.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}/chapter/${chapter}`,
      languages: {
        en: `/en/chapter/${chapter}`,
        vi: `/vi/chapter/${chapter}`
      }
    }
  };
};

export default function ChapterPage({ params }: PageProps) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const strings = getLocaleStrings(lang);

  if (!hasHscodeData()) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          {strings.notFound}
        </h1>
      </main>
    );
  }

  const chapter = params.chapter;
  if (!/^\d{2}$/.test(chapter)) notFound();

  const items = getAllHscodes().filter((item) =>
    item.hs_code.startsWith(chapter)
  );
  if (items.length === 0) notFound();

  const breadcrumbParentLabel = lang === "en" ? "Vietnam HS" : "Mã HS VN";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
      <nav className="mb-6 flex flex-wrap items-center justify-between gap-3" aria-label="Breadcrumb">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Link href="/" className="hover:text-slate-900">
            {lang === "en" ? "Home" : "Trang chủ"}
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/${lang}`} className="hover:text-slate-900">
            {breadcrumbParentLabel}
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-slate-900">
            {lang === "en" ? `Chapter ${chapter}` : `Chương ${chapter}`}
          </span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ← {lang === "en" ? "Home" : "Trang chủ"}
        </Link>
      </nav>
      <header className="mb-2 flex items-start gap-3">
        <span className="text-3xl" aria-hidden>🇻🇳</span>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            {lang === "en" ? `Chapter ${chapter}` : `Chương ${chapter}`}
          </h1>
          <p className="text-base text-slate-600">
            {lang === "en"
              ? "Browse HS codes and open each detail page to view tariffs."
              : "Danh sách mã HS; mở từng trang để xem thuế nhập khẩu."}
          </p>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {items.slice(0, 200).map((item) => (
          <Link
            key={item.slug}
            href={`/${lang}/hs-code/${item.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm hover:bg-slate-50"
          >
            <div className="font-semibold text-slate-900">{item.hs_code}</div>
            <div className="text-slate-600">
              {lang === "en" ? item.name_en : item.name_vi}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
