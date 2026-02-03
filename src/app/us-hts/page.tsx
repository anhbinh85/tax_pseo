import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd, webPageWithBreadcrumb } from "@/components/JsonLd";
import { UsHtsLookup } from "@/components/UsHtsLookup";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vietnamhs.info";

const title = "US HTS Import Duty Lookup | China vs Vietnam vs Mexico vs EU UK Australia";
const description =
  "Look up US Harmonized Tariff Schedule (HTS) import duties. Compare rates from China (Section 301), Vietnam, Mexico (USMCA), EU, UK, Australia, Korea (KORUS), Japan, Canada, India.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${siteUrl}/us-hts` },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/us-hts`,
    images: [{ url: "/hero-bg.jpg", width: 1200, height: 630, alt: title }],
  },
};

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function UsHtsIndexPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const slug = (q ?? "")
    .toString()
    .replace(/[\s.]/g, "")
    .replace(/\D/g, "")
    .slice(0, 10);
  if (slug.length === 4 || slug.length === 6 || slug.length === 8 || slug.length === 10) {
    redirect(`/us-hts/${slug}`);
  }
  const jsonLd = webPageWithBreadcrumb(
    title,
    description,
    "/us-hts",
    [{ name: "Home", path: "/en" }, { name: "US HTS Lookup", path: "/us-hts" }]
  );
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <JsonLd data={jsonLd} />
      <nav className="mb-6 flex items-center gap-3 text-sm text-slate-600" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-slate-900">US HTS Lookup</span>
      </nav>
      <header className="mb-8 flex flex-wrap items-start gap-3">
        <span className="text-4xl" aria-hidden>🇺🇸</span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            US HTS Import Duty Lookup
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Compare import duty into the USA by origin: Vietnam, China, Mexico,
            India, EU, UK, Australia, Korea, Japan, Canada. Section 301 and FTA rates for each HTS code.
          </p>
        </div>
      </header>

      <section className="rounded-xl border-2 border-slate-200 bg-white p-6 shadow-sm" role="search" aria-label="US HTS search">
        <h2 className="text-xl font-semibold text-slate-800">
          Global Sourcing Matrix
        </h2>
        <p className="mt-2 text-slate-600">
          <strong>Section 1</strong>: Lookup from HTS database (code or wording; results as you type). <strong>Section 2</strong>: AI HTS suggestion (keyword and/or image; click &quot;Get AI suggestion&quot;).
        </p>
        <div className="mt-4">
          <UsHtsLookup />
        </div>
      </section>

      <section className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ← Home
        </Link>
      </section>
      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Vietnam HS Code Lookup
        </h2>
        <p className="mt-2 text-slate-600">
          For Vietnam import/export tariffs and EVFTA rates, use our Vietnam HS
          code pages.
        </p>
        <Link
          href="/vi"
          className="mt-3 inline-block text-emerald-600 hover:underline"
        >
          Vietnam HS Code Search →
        </Link>
      </section>
    </main>
  );
}
