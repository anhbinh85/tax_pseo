import Link from "next/link";

export default function UsHtsNotFound() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl" aria-hidden>🇺🇸</span>
        <h1 className="text-2xl font-bold text-slate-900">
          US HTS Code Not Found
        </h1>
      </div>
      <p className="mt-3 text-slate-600">
        This 8- or 10-digit HTS code is not in the current US HTS database. Check
        the code or try another (e.g. 01012100, 40111010, 84713001).
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ← Home
        </Link>
        <Link
          href="/us-hts"
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Back to US HTS Lookup
        </Link>
      </div>
    </main>
  );
}
