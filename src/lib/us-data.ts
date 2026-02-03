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
    au_fta?: boolean;
    eu_pref?: boolean;
  };
}

const dataPath = path.join(process.cwd(), "src", "data", "us-hts-processed.json");

export const hasUsHtsData = (): boolean => fs.existsSync(dataPath);

let cached: USHTSData[] | null = null;

const loadData = (): USHTSData[] => {
  if (cached) return cached;
  if (!hasUsHtsData()) return [];
  const raw = fs.readFileSync(dataPath, "utf-8");
  cached = JSON.parse(raw) as USHTSData[];
  return cached;
};

export const getUsHtsBySlug = (slug: string): USHTSData | null => {
  const all = loadData();
  const exact = all.find((item) => item.slug === slug);
  if (exact) return exact;
  // 8-digit slug (e.g. 85171300) may match US 10-digit heading (8517130000); return first subheading
  if (slug.length === 8 && /^\d{8}$/.test(slug)) {
    const first = all.find((item) => item.slug.startsWith(slug));
    return first ?? null;
  }
  return null;
};

export const getAllUsHtsSlugs = (): string[] => {
  const all = loadData();
  return all.map((item) => item.slug);
};

export const getAllUsHtsData = (): USHTSData[] => loadData();

/** Items whose slug starts with the 2-digit chapter (e.g. "03"). */
export const getUsHtsByChapter = (chapter: string): USHTSData[] => {
  const all = loadData();
  return all.filter((item) => item.slug.startsWith(chapter));
};

/** Items whose slug starts with the given prefix (e.g. "4011" for 4-digit heading). */
export const getUsHtsByHeading = (prefix: string): USHTSData[] => {
  const all = loadData();
  return all.filter((item) => item.slug.startsWith(prefix));
};
