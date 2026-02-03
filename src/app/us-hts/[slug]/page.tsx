import Link from "next/link";
import type { Metadata } from "next";
import GlobalDutyMatrix from "@/components/GlobalDutyMatrix";
import {
  getUsHtsBySlug,
  getUsHtsByHeading,
  hasUsHtsData,
  getAllUsHtsSlugs,
} from "@/lib/us-data";
import { findBySlug as findVnBySlug, hasHscodeData as hasVnHscodeData } from "@/lib/hscode";
import { getChapterTitle } from "@/lib/hts-chapters";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vietnamhs.info";

type PageProps = {
  params: { slug: string };
};

export const dynamicParams = true;
export const revalidate = 60 * 60 * 24;

export async function generateStaticParams() {
  if (!hasUsHtsData()) return [];
  const slugs = getAllUsHtsSlugs();
  return slugs.slice(0, 4000).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const item = getUsHtsBySlug(params.slug);
  const headingItems = (params.slug.length === 4 || params.slug.length === 6) && /^\d+$/.test(params.slug)
    ? getUsHtsByHeading(params.slug)
    : [];
  if (!item && headingItems.length === 0) return { title: `HTS code ${params.slug} not in database | US HTS` };
  if (!item && headingItems.length > 0) return { title: `Heading ${params.slug} | US HTS` };
  if (!item) return { title: "US HTS" };

  const title = `Import Duty for ${item.display_code} into USA: China vs Vietnam vs Mexico Rates`;
  const description = `US import duty for ${item.display_code} (${item.description}). Compare rates from Vietnam, China, Mexico, Korea, and India. Section 301 and FTA rates.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/us-hts/${item.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/us-hts/${item.slug}`,
      images: [{ url: "/hero-bg.jpg", width: 1200, height: 630, alt: item.display_code }],
    },
  };
}

export default function UsHtsPage({ params }: PageProps) {
  if (!hasUsHtsData()) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          US HTS Data Not Available
        </h1>
        <p className="mt-3 text-slate-600">
          Run <code className="rounded bg-slate-200 px-1.5 py-0.5 text-sm">npm run process-us-data</code> to generate the US HTS database.
        </p>
      </main>
    );
  }

  const item = getUsHtsBySlug(params.slug);
  const isHeadingSlug = (params.slug.length === 4 || params.slug.length === 6) && /^\d+$/.test(params.slug);
  const headingItems = isHeadingSlug ? getUsHtsByHeading(params.slug) : [];

  if (!item && headingItems.length > 0) {
    const chapterTitle = getChapterTitle(params.slug.slice(0, 2));
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/us-hts" className="hover:text-slate-900">US HTS</Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-slate-900">Heading {params.slug}</span>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">← Home</Link>
        </nav>
        <header className="mb-6 flex items-start gap-3">
          <span className="text-3xl" aria-hidden>🇺🇸</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Heading {params.slug}
              {chapterTitle && (
                <span className="ml-2 text-lg font-normal text-slate-600">
                  (Chapter {params.slug.slice(0, 2)}: {chapterTitle})
                </span>
              )}
            </h1>
            <p className="mt-1 text-slate-600">
              {headingItems.length} subheading(s). Click a code for duty rates.
            </p>
          </div>
        </header>
        <ul className="grid gap-2 sm:grid-cols-2">
          {headingItems.slice(0, 200).map((row) => (
            <li key={row.slug}>
              <Link
                href={`/us-hts/${row.slug}`}
                className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm hover:border-amber-300 hover:bg-amber-50/50"
              >
                <span className="font-mono font-semibold text-slate-900">{row.display_code}</span>
                <span className="ml-2 text-slate-600">{row.description}</span>
              </Link>
            </li>
          ))}
        </ul>
        {headingItems.length > 200 && (
          <p className="mt-4 text-sm text-slate-500">
            Showing first 200 of {headingItems.length}. Use search on <Link href="/us-hts" className="text-amber-600 hover:underline">US HTS Lookup</Link> for more.
          </p>
        )}
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-3xl" aria-hidden>🇺🇸</span>
          <h1 className="text-2xl font-bold text-slate-900">
            HTS code not in database
          </h1>
        </div>
        <p className="mt-3 text-slate-700">
          The HTS code <strong className="font-mono">{params.slug}</strong> (suggested by AI) was not found in our current US HTS database.
        </p>
        <div className="mt-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-slate-800">
          <p className="font-semibold">What you can do:</p>
          <ol className="list-inside list-decimal space-y-2">
            <li>
              Type <strong className="font-mono">{params.slug}</strong> (or a shorter code) into the <strong>search box</strong> on the US HTS Lookup page and search to see similar headings.
            </li>
            <li>
              Try reducing the code (e.g. from 8 digits to 6 or 4) to find the correct <strong>group or section</strong> (e.g. 2208 for spirits, 220830 for whisky).
            </li>
            <li>
              If you still cannot find it, click <strong>Contact</strong> and send your product or code so we can help.
            </li>
          </ol>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/us-hts"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← US HTS Lookup
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            href="/en/contact"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
          >
            Contact
          </Link>
        </div>
      </main>
    );
  }

  const vnSlug8 = item.slug.slice(0, 8);
  const vnSlugForLink = hasVnHscodeData()
    ? (findVnBySlug(item.slug) ? item.slug : findVnBySlug(vnSlug8) ? vnSlug8 : null)
    : null;
  const vnPageExists = !!vnSlugForLink;

  const unitsDisplay =
    item.units.length > 0 ? ` (${item.units.join(", ")})` : "";

  const pageUrl = `${siteUrl}/us-hts/${item.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `Import Duty for ${item.display_code} into USA`,
        description: `US import duty for ${item.display_code}: ${item.description}. Compare rates from Vietnam, China, Mexico, Korea, India.`,
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        mainEntity: {
          "@type": "DefinedTerm",
          name: item.display_code,
          description: item.description,
          termCode: item.display_code,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "US HTS Lookup", item: `${siteUrl}/us-hts` },
          { "@type": "ListItem", position: 3, name: item.display_code, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link href="/us-hts" className="hover:text-slate-900">
            US HTS
          </Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-slate-900">{item.display_code}</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ← Home
        </Link>
      </nav>

      <article>
        <header className="mb-6 flex flex-wrap items-start gap-2">
          <span className="text-3xl" aria-hidden>🇺🇸</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Import Duty for {item.display_code} into USA
            </h1>
          <p className="mt-2 text-lg text-slate-700">
            {item.description}
            {unitsDisplay}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            HTS Code: <strong>{item.display_code}</strong>
          </p>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="sr-only">Product details</h2>
          {getChapterTitle(item.slug) && (
            <p className="mb-3 text-sm font-medium text-slate-500">
              Chapter {item.slug.slice(0, 2)}: {getChapterTitle(item.slug)}
            </p>
          )}
          <dl className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-slate-600">Code:</dt>
              <dd>{item.display_code}</dd>
            </div>
            <div className="mt-2 flex gap-2">
              <dt className="font-medium text-slate-600">Description:</dt>
              <dd>{item.description}</dd>
            </div>
            {item.units.length > 0 && (
              <div className="mt-2 flex gap-2">
                <dt className="font-medium text-slate-600">Units:</dt>
                <dd>{item.units.join(", ")}</dd>
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <dt className="font-medium text-slate-600">General (MFN):</dt>
              <dd>{item.rates.mfn}</dd>
            </div>
          </dl>
        </section>

        <section className="mb-8">
          <GlobalDutyMatrix
            rates={item.rates}
            displayCode={item.display_code}
            showVnLink={vnPageExists}
            vnSlugForLink={vnSlugForLink ?? undefined}
          />
        </section>

        {vnPageExists && (
          <section className="rounded-xl border border-slate-200 bg-slate-50/30 p-4">
            <h2 className="text-base font-semibold text-slate-800">
              Compare with Vietnam Import Tariffs
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              See Vietnam HS code {vnSlugForLink} for export duty from Vietnam and EVFTA rates.
            </p>
            <Link
              href={`/vi/hs-code/${vnSlugForLink}`}
              className="mt-3 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Vietnam HS {vnSlugForLink} →
            </Link>
          </section>
        )}
      </article>
    </main>
  );
}
