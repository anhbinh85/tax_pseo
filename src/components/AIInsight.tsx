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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {strings.aiBadge}
        </span>
      </div>
      {loading ? (
        <div className="mt-4 space-y-2 animate-pulse">
          <div className="h-3 w-5/6 rounded bg-slate-200" />
          <div className="h-3 w-4/6 rounded bg-slate-200" />
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-700">
          {text ?? strings.notAvailable}
        </p>
      )}
    </div>
  );
};
