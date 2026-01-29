"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getLocaleStrings, type Locale } from "@/lib/i18n";
import { useSearch } from "@/hooks/useSearch";

type Props = {
  lang: Locale;
  variant?: "hero" | "default";
};

export const SearchBar = ({ lang, variant = "default" }: Props) => {
  const strings = getLocaleStrings(lang);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReturnType<typeof useSearch>>([]);
  const searchResults = useSearch(query);
  const router = useRouter();
  const isHero = variant === "hero";

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setResults(searchResults);
    }, 150);

    return () => clearTimeout(handle);
  }, [query, searchResults]);

  const handleSubmit = () => {
    if (results[0]) {
      router.push(`/${lang}/hs-code/${results[0].slug}`);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div
        className={`flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/95 p-2 shadow-lg md:flex-row md:items-center ${
          isHero ? "backdrop-blur" : "bg-white"
        }`}
      >
        <input
          className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none"
          placeholder={strings.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results[0]) {
              router.push(`/${lang}/hs-code/${results[0].slug}`);
            }
          }}
        />
        <button
          type="button"
          className="w-full rounded-xl bg-brand-red px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-red-700 md:w-auto"
          onClick={handleSubmit}
        >
          Search
        </button>
      </div>
      {results.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          {results.map((item) => (
            <Link
              key={item.slug}
              href={`/${lang}/hs-code/${item.slug}`}
              className="block border-b border-slate-100 px-4 py-3 text-sm last:border-none hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">
                  {item.hs_code} - {lang === "en" ? item.name_en : item.name_vi}
                </div>
                {(item.taxes?.nk_tt || item.taxes?.mfn) && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {item.taxes?.nk_tt
                      ? `NK TT ${item.taxes.nk_tt}`
                      : `MFN ${item.taxes?.mfn}`}
                  </span>
                )}
              </div>
              <div className="text-slate-500">
                {lang === "en" ? item.name_vi : item.name_en}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
