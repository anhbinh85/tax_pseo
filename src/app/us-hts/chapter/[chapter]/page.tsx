import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  hasUsHtsData,
  getUsHtsByChapter,
} from "@/lib/us-data";
import {
  HTS_CHAPTER_TITLES,
  getUsHtsChapterCodes,
} from "@/lib/hts-chapters";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vietnamhs.info";

type PageProps = { params: { chapter: string } };

export function generateStaticParams() {
  if (!hasUsHtsData()) return [];
  return getUsHtsChapterCodes().map((chapter) => ({ chapter }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { chapter } = params;
  const title = HTS_CHAPTER_TITLES[chapter];
  if (!title) return { title: "US HTS Chapter" };
  return {
    title: `US HTS Chapter ${chapter}: ${title}`,
    description: `Browse US Harmonized Tariff Schedule codes for Chapter ${chapter} - ${title}.`,
    alternates: { canonical: `${siteUrl}/us-hts/chapter/${chapter}` },
  };
}

export default function UsHtsChapterPage({ params }: PageProps) {
  const { chapter } = params;
  if (!/^\d{2}$/.test(chapter) || !HTS_CHAPTER_TITLES[chapter]) {
    notFound();
  }
  const items = getUsHtsByChapter(chapter);
  const title = HTS_CHAPTER_TITLES[chapter];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/us-hts" className="hover:text-slate-900">US HTS</Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-slate-900">Chapter {chapter}</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ← Home
        </Link>
      </nav>
      <header className="mb-6 flex items-start gap-3">
        <span className="text-3xl" aria-hidden>🇺🇸</span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            US HTS Chapter {chapter}: {title}
          </h1>
          <p className="mt-1 text-slate-600">
            {items.length} heading(s). Select a code for duty rates.
          </p>
        </div>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.slice(0, 200).map((item) => (
          <li key={item.slug}>
            <Link
              href={`/us-hts/${item.slug}`}
              className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm hover:border-amber-300 hover:bg-amber-50/50"
            >
              <span className="font-mono font-semibold text-slate-900">{item.display_code}</span>
              <span className="ml-2 text-slate-600">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
      {items.length > 200 && (
        <p className="mt-4 text-sm text-slate-500">
          Showing first 200 of {items.length}. Use search on{" "}
          <Link href="/us-hts" className="text-amber-600 hover:underline">US HTS Lookup</Link> for more.
        </p>
      )}
    </main>
  );
}
