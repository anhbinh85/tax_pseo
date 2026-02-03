"use client";

import Link from "next/link";

export type GlobalDutyRates = {
  mfn: string;
  china_301: boolean;
  usmca_mx: boolean;
  korea_fta: boolean;
  ca_usmca?: boolean;
  au_fta?: boolean;
  eu_pref?: boolean;
};

type Props = {
  rates: GlobalDutyRates;
  displayCode: string;
  /** Only show Vietnam "VN Export Page" link when Vietnam HS page exists for this code */
  showVnLink?: boolean;
  /** Exact Vietnam slug to use for the link (avoids 404 when VN uses 10-digit) */
  vnSlugForLink?: string;
};

const parseBasePercent = (mfn: string): number | null => {
  const t = (mfn ?? "").trim();
  if (t === "Free" || t === "") return 0;
  const match = t.match(/^([\d.]+)\s*%?$/);
  if (match) return parseFloat(match[1]);
  return null;
};

const formatRateDisplay = (
  mfn: string,
  china301: boolean,
  isFree: boolean
): { text: string; isNumeric: boolean } => {
  if (isFree) return { text: "0%", isNumeric: true };
  const pct = parseBasePercent(mfn);
  if (pct !== null) {
    const rate = china301 ? pct + 25 : pct;
    return { text: `${rate}%`, isNumeric: true };
  }
  return { text: mfn || "—", isNumeric: false };
};

const rows: Array<{
  id: string;
  origin: string;
  flag: string;
  getRate: (r: GlobalDutyRates) => { text: string; isNumeric: boolean };
  status?: string;
  getStatus?: (r: GlobalDutyRates) => string;
  statusClass: string;
  action?: { label: string; href: string; slugKey?: boolean };
  highlight?: "best" | "penalty" | "standard";
}> = [
  {
    id: "vn",
    origin: "Vietnam",
    flag: "🇻🇳",
    getRate: (r) => formatRateDisplay(r.mfn, false, false),
    status: "Best Value",
    statusClass: "text-emerald-700",
    action: { label: "VN Export Page", href: "/vi/hs-code", slugKey: true },
    highlight: "best",
  },
  {
    id: "cn",
    origin: "China",
    flag: "🇨🇳",
    getRate: (r) => formatRateDisplay(r.mfn, r.china_301, false),
    getStatus: (r) => (r.china_301 ? "High Tariff" : "MFN"),
    statusClass: "text-red-700",
    highlight: "penalty",
  },
  {
    id: "mx",
    origin: "Mexico",
    flag: "🇲🇽",
    getRate: (r) => formatRateDisplay(r.mfn, false, r.usmca_mx),
    status: "Nearshore",
    statusClass: "text-blue-700",
    highlight: "best",
  },
  {
    id: "in",
    origin: "India",
    flag: "🇮🇳",
    getRate: (r) => formatRateDisplay(r.mfn, false, false),
    status: "Emerging",
    statusClass: "text-slate-600",
    highlight: "standard",
  },
  {
    id: "eu",
    origin: "European Union",
    flag: "🇪🇺",
    getRate: (r) => formatRateDisplay(r.mfn, false, r.eu_pref === true),
    getStatus: (r) => (r.eu_pref ? "Preferential" : "High Quality"),
    statusClass: "text-slate-700",
  },
  {
    id: "uk",
    origin: "United Kingdom",
    flag: "🇬🇧",
    getRate: (r) => formatRateDisplay(r.mfn, false, false),
    status: "Alliance",
    statusClass: "text-slate-700",
  },
  {
    id: "au",
    origin: "Australia",
    flag: "🇦🇺",
    getRate: (r) => formatRateDisplay(r.mfn, false, r.au_fta === true),
    getStatus: (r) => (r.au_fta ? "Preferential" : "Alliance"),
    statusClass: "text-slate-700",
  },
  {
    id: "kr",
    origin: "Korea",
    flag: "🇰🇷",
    getRate: (r) => formatRateDisplay(r.mfn, false, r.korea_fta),
    status: "High Tech",
    statusClass: "text-slate-700",
  },
  {
    id: "jp",
    origin: "Japan",
    flag: "🇯🇵",
    getRate: (r) => formatRateDisplay(r.mfn, false, false),
    status: "High Tech",
    statusClass: "text-slate-700",
  },
  {
    id: "ca",
    origin: "Canada",
    flag: "🇨🇦",
    getRate: (r) => formatRateDisplay(r.mfn, false, r.ca_usmca === true),
    status: "USMCA",
    statusClass: "text-slate-700",
  },
  {
    id: "ru",
    origin: "Russia",
    flag: "🇷🇺",
    getRate: (r) => formatRateDisplay(r.mfn, false, false),
    status: "Standard",
    statusClass: "text-slate-600",
  },
];

export default function GlobalDutyMatrix({
  rates,
  displayCode,
  showVnLink = false,
  vnSlugForLink: vnSlugProp,
}: Props) {
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
      aria-labelledby="global-duty-matrix-heading"
    >
      <h2 id="global-duty-matrix-heading" className="sr-only">
        Global Sourcing Duty Comparison
      </h2>
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-6">
        <h3 className="text-base font-semibold text-slate-800 sm:text-lg">
          Global Sourcing Matrix
        </h3>
        <p className="mt-0.5 text-sm text-slate-600">
          Compare import duty into the USA by origin for {displayCode}: Vietnam,
          China, Mexico, India, EU, UK, Australia, Korea, Japan, Canada, Russia.{" "}
          <span className="font-medium text-slate-700">Special/FTA in this data:</span> Mexico & Canada (USMCA), Korea (KORUS), Australia (AU), EU (when Preferential). UK per trade agreements—check official source.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="px-4 py-3 font-semibold text-slate-700 sm:pl-6">
                Origin
              </th>
              <th className="px-4 py-3 font-semibold text-slate-700">
                Duty Rate
              </th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700 sm:pr-6">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { text: rateText } = row.getRate(rates);
              const isBest =
                row.highlight === "best" &&
                (row.id === "mx"
                  ? rates.usmca_mx
                  : row.id === "ca"
                    ? rates.ca_usmca
                    : row.id === "vn");
              const isPreferential =
                (row.id === "eu" && rates.eu_pref) || (row.id === "au" && rates.au_fta);
              const isPenalty =
                row.highlight === "penalty" && rates.china_301;
              const hasVnAction =
                row.id === "vn" && row.action?.slugKey && showVnLink && vnSlugProp;
              const actionHref =
                hasVnAction
                  ? `/vi/hs-code/${vnSlugProp}`
                  : row.action?.slugKey
                    ? ""
                    : row.action?.href ?? "";

              return (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${
                    isPenalty ? "bg-red-50/60" : ""
                  } ${isBest || isPreferential ? "bg-emerald-50/70" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800 sm:pl-6">
                    <span className="mr-2" aria-hidden>
                      {row.flag}
                    </span>
                    {row.origin}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-800">
                    {rateText}
                  </td>
                  <td className={`px-4 py-3 ${row.statusClass}`}>
                    {row.id === "cn" && rates.china_301 ? "⛔ " : ""}
                    {row.id === "mx" && rates.usmca_mx ? "⚡ " : ""}
                    {row.id === "kr" && rates.korea_fta ? "⚙️ " : ""}
                    {row.id === "ca" && rates.ca_usmca ? "🍁 " : ""}
                    {row.id === "vn" ? "✅ " : ""}
                    {row.id === "in" ? "🏢 " : ""}
                    {row.id === "eu" ? "🛡️ " : ""}
                    {row.id === "uk" ? "🇬🇧 " : ""}
                    {row.id === "au" ? "🇦🇺 " : ""}
                    {row.id === "jp" ? "⚙️ " : ""}
                    {row.id === "ru" ? "📦 " : ""}
                    <span className="ml-0">
                      {row.getStatus ? row.getStatus(rates) : row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:pr-6">
                    {row.action && (hasVnAction || actionHref) ? (
                      <Link
                        href={actionHref || (vnSlugProp ? `/vi/hs-code/${vnSlugProp}` : "#")}
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        {row.action.label}
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
