import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllHscodes,
  getChapterCodes,
  hasHscodeData
} from "@/lib/hscode";
import { getLocaleStrings, isLocale, type Locale } from "@/lib/i18n";

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
      ? `Import Duties for Chapter ${chapter} (Vietnam 2026)`
      : `Thuế Nhập khẩu Chương ${chapter} (Việt Nam 2026)`;
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

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          {lang === "en" ? `Chapter ${chapter}` : `Chương ${chapter}`}
        </h1>
        <p className="text-base text-slate-600">
          {lang === "en"
            ? "Browse HS codes and open each detail page to view tariffs."
            : "Danh sách mã HS; mở từng trang để xem thuế nhập khẩu."}
        </p>
      </div>

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
