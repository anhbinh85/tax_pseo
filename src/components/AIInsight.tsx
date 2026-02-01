"use client";

import { useEffect, useState } from "react";
import { getLocaleStrings, type Locale } from "@/lib/i18n";

type Props = {
  hs_code: string;
  name_en: string;
  lang: Locale;
};

export const AIInsight = ({ hs_code, name_en, lang }: Props) => {
  const strings = getLocaleStrings(lang);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hs_code, name_en })
        });
        const data = (await res.json()) as { text?: string };
        if (isMounted) {
          setText(data.text ?? null);
        }
      } catch {
        if (isMounted) setText(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [hs_code, name_en]);

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-brand-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-gold">
          {strings.aiBadge}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          {lang === "en" ? "Recommended" : "Gợi ý nhanh"}
        </span>
      </div>
      {loading ? (
        <div className="mt-4 space-y-2 animate-pulse">
          <div className="h-3 w-5/6 rounded bg-slate-200" />
          <div className="h-3 w-4/6 rounded bg-slate-200" />
        </div>
      ) : (
        <p id="ai-insight-text" className="mt-4 text-sm text-slate-700">
          {text ?? strings.notAvailable}
        </p>
      )}
    </div>
  );
};
