"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "vn" | "us";

type Props = {
  lang: string;
  vnChapters: string[];
  usChapters: string[];
  /** EN labels when lang is en */
  labels?: {
    browseByChapter: string;
    chapter: string;
    vnHsCode: string;
    usHts: string;
  };
};

export function BrowseByChapterTabs({
  lang,
  vnChapters,
  usChapters,
  labels = {
    browseByChapter: "Browse by Chapter",
    chapter: "Chapter",
    vnHsCode: "VN HS Code",
    usHts: "US HTS",
  },
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("vn");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {labels.browseByChapter}
      </h2>
      <div className="mt-3 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("vn")}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "vn"
              ? "border border-b-0 border-slate-200 border-b-white bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          {labels.vnHsCode}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("us")}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "us"
              ? "border border-b-0 border-slate-200 border-b-white bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          {labels.usHts}
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {activeTab === "vn" &&
          vnChapters.map((chapter) => (
            <Link
              key={chapter}
              href={`/${lang}/chapter/${chapter}`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-red hover:bg-white"
            >
              {labels.chapter} {chapter}
            </Link>
          ))}
        {activeTab === "us" &&
          usChapters.map((chapter) => (
            <Link
              key={chapter}
              href={`/us-hts/chapter/${chapter}`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-white"
            >
              {labels.chapter} {chapter}
            </Link>
          ))}
      </div>
    </section>
  );
}
