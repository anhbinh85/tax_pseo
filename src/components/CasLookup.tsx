"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

type Suggestion = {
  cas: string;
  name_vi?: string;
  name_en?: string;
  hs_code?: string;
  formula?: string;
  reason: string;
};

type Props = {
  lang: Locale;
};

export const CasLookup = ({ lang }: Props) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/cas-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = (await res.json()) as { suggestions?: Suggestion[] };
      setSuggestions(data.suggestions ?? []);
    } catch {
      setError(
        lang === "en"
          ? "Could not fetch CAS results. Please try again."
          : "Không thể tra cứu CAS. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">
          {lang === "en" ? "CAS Number Lookup" : "Tra cứu số CAS"}
        </h2>
        <p className="text-sm text-slate-600">
          {lang === "en"
            ? "Search CAS by chemical name. We check the CAS list first, then use AI if missing."
            : "Tra cứu CAS theo tên hoá chất. Hệ thống ưu tiên danh mục CAS trước, nếu không có sẽ dùng AI."}
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
          rows={3}
          placeholder={
            lang === "en"
              ? "Example: acetic acid, methanol, caffeine"
              : "Ví dụ: axit axetic, methanol, caffeine"
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!query.trim() || loading}
        >
          {loading
            ? lang === "en"
              ? "Finding..."
              : "Đang tra cứu..."
            : lang === "en"
              ? "Find CAS"
              : "Tra cứu CAS"}
        </button>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {lang === "en"
            ? "AI can be wrong. Please validate its result."
            : "AI có thể sai. Vui lòng kiểm tra lại kết quả."}
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((item) => (
            <div
              key={`${item.cas}-${item.name}`}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="text-sm font-semibold text-slate-900">
                {item.cas} - {lang === "en" ? item.name_en ?? item.name_vi : item.name_vi ?? item.name_en}
              </div>
              {(item.name_en || item.name_vi) && (
                <div className="mt-1 text-xs text-slate-500">
                  {lang === "en" ? item.name_vi : item.name_en}
                </div>
              )}
              <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                {item.hs_code && (
                  <div>
                    <span className="font-semibold">HS:</span> {item.hs_code}
                  </div>
                )}
                {item.formula && (
                  <div>
                    <span className="font-semibold">Formula:</span> {item.formula}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                {item.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
