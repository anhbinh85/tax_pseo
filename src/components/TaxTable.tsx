import { getLocaleStrings, type Locale } from "@/lib/i18n";

type Props = {
  lang: Locale;
  taxes?: Record<string, string>;
};

const taxLabels: Record<string, { label: string; flag: string }> = {
  form_e: { label: "Form E (ACFTA)", flag: "🇨🇳" },
  form_d: { label: "ATIGA", flag: "🌏" },
  ajcep: { label: "AJCEP", flag: "🇯🇵" },
  vjepa: { label: "VJEPA", flag: "🇯🇵" },
  akfta: { label: "AKFTA", flag: "🇰🇷" },
  aanzfta: { label: "AANZFTA", flag: "🇦🇺" },
  aifta: { label: "AIFTA", flag: "🇮🇳" },
  vkfta: { label: "VKFTA", flag: "🇰🇷" },
  vcfta: { label: "VCFTA", flag: "🇨🇱" },
  vn_eaeu: { label: "VN-EAEU", flag: "🇷🇺" },
  cptpp: { label: "CPTPP", flag: "🌎" },
  ahkfta: { label: "AHKFTA", flag: "🇭🇰" },
  eur1: { label: "EVFTA", flag: "🇪🇺" },
  ukv: { label: "UKVFTA", flag: "🇬🇧" },
  vn_lao: { label: "VN-LAO", flag: "🇱🇦" },
  vifta: { label: "VIFTA", flag: "🇮🇱" },
  rcept: { label: "RCEP", flag: "🌏" }
};

const taxOrder = [
  "form_e",
  "form_d",
  "ajcep",
  "vjepa",
  "akfta",
  "aanzfta",
  "aifta",
  "vkfta",
  "vcfta",
  "vn_eaeu",
  "cptpp",
  "ahkfta",
  "eur1",
  "ukv",
  "vn_lao",
  "vifta",
  "rcept"
];

export const TaxTable = ({ lang, taxes }: Props) => {
  const strings = getLocaleStrings(lang);
  const safeTaxes = taxes ?? {};
  const orderedTaxes = taxOrder
    .filter((key) => safeTaxes[key])
    .map((key) => ({
      key,
      label: taxLabels[key]?.label ?? key.toUpperCase(),
      flag: taxLabels[key]?.flag ?? "🌏",
      value: safeTaxes[key]
    }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          {lang === "en" ? "FTA Matrix" : "Ma trận FTA"}
        </h2>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {lang === "en" ? "Preferential rates" : "Thuế ưu đãi"}
        </span>
      </div>
      {orderedTaxes.length === 0 ? (
        <div className="mt-4 text-sm text-slate-600">
          {strings.notAvailable}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {orderedTaxes.map((tax) => {
            const normalized = tax.value?.replace(/\s/g, "") ?? "";
            const isFree = normalized === "0" || normalized === "0%";
            return (
              <div
                key={tax.key}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">
                    {tax.flag} {tax.label}
                  </div>
                  {isFree && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      ✅ Free
                    </span>
                  )}
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-900">
                  {tax.value}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
