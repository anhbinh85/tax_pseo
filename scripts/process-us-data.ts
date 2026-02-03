import fs from "fs";
import path from "path";

export interface USHTSData {
  slug: string;
  display_code: string;
  description: string;
  units: string[];
  rates: {
    mfn: string;
    china_301: boolean;
    usmca_mx: boolean;
    korea_fta: boolean;
    ca_usmca: boolean;
    /** Australia preferential (AU in special column) */
    au_fta?: boolean;
    /** EU preference (E/D etc. in special column) */
    eu_pref?: boolean;
  };
}

type RawRow = {
  htsno?: string | null;
  description?: string | null;
  units?: string[] | null;
  general?: string | null;
  special?: string | null;
  footnotes?: Array<{ value?: string }> | null;
};

const INPUT_PATH = path.join(process.cwd(), "Ref", "hts-ref", "us-hts.json");
const OUTPUT_PATH = path.join(process.cwd(), "src", "data", "us-hts-processed.json");

const ensureOutputDir = () => {
  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const toSlug = (htsno: string): string => htsno.replace(/\./g, "").trim();

const isValidSlug = (slug: string): boolean =>
  /^\d{8}$/.test(slug) || /^\d{10}$/.test(slug);

const getMfn = (general: string | undefined | null): string => {
  const v = (general ?? "").trim();
  return v || "Free";
};

const hasChina301 = (footnotes: RawRow["footnotes"]): boolean => {
  if (!footnotes || !Array.isArray(footnotes)) return false;
  return footnotes.some((fn) => {
    const val = (fn?.value ?? "").toString();
    return val.includes("9903.88") || val.includes("Section 301");
  });
};

const specialContains = (special: string | undefined | null, code: string): boolean => {
  const s = (special ?? "").toString();
  // Match code as word (e.g. "KR" not inside "OKR"); country codes are 2 letters
  return new RegExp(`\\b${code}\\b`).test(s) || s.includes(code);
};

/** Australia has preferential rate when AU appears in special (e.g. "Free (A+,AU,...)") */
const hasAuFta = (special: string | undefined | null): boolean =>
  specialContains(special, "AU");

/** EU preference when E (Spain) or D (Germany) in special - US HTS uses country codes */
const hasEuPref = (special: string | undefined | null): boolean =>
  specialContains(special, "E") || specialContains(special, "D");

const main = () => {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Missing input: ${INPUT_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  let rows: RawRow[];
  try {
    rows = JSON.parse(raw) as RawRow[];
  } catch (e) {
    console.error("Invalid JSON in us-hts.json");
    process.exit(1);
  }

  const out: USHTSData[] = [];

  for (const row of rows) {
    const htsno = (row.htsno ?? "").toString().trim();
    if (!htsno) continue;

    const slug = toSlug(htsno);
    if (!isValidSlug(slug)) continue;

    const display_code = htsno;
    const description = (row.description ?? "").toString().trim() || "—";
    const units = Array.isArray(row.units)
      ? (row.units as string[]).filter((u) => typeof u === "string")
      : [];

    const mfn = getMfn(row.general);
    const china_301 = hasChina301(row.footnotes);
    const usmca_mx = specialContains(row.special, "MX");
    const korea_fta = specialContains(row.special, "KR");
    const ca_usmca = specialContains(row.special, "CA");
    const au_fta = hasAuFta(row.special);
    const eu_pref = hasEuPref(row.special);

    out.push({
      slug,
      display_code,
      description,
      units,
      rates: { mfn, china_301, usmca_mx, korea_fta, ca_usmca, au_fta, eu_pref },
    });
  }

  ensureOutputDir();
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 0), "utf-8");
  console.log(`✅ Processed ${out.length} US HTS records → ${OUTPUT_PATH}`);
};

main();
