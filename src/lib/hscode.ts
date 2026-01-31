import fs from "fs";
import path from "path";

export type HscodeItem = {
  hs_code: string;
  slug: string;
  name_vi: string;
  name_en: string;
  unit: string;
  vat: string | null;
  excise_tax?: string | null;
  export_tax?: string | null;
  export_cptpp?: string | null;
  export_ev?: string | null;
  export_ukv?: string | null;
  env_tax?: string | null;
  policy?: string | null;
  vat_reduction?: string | null;
  taxes: Record<string, string>;
};

const dataPath = path.join(process.cwd(), "src", "data", "hscode.json");

export const hasHscodeData = () => fs.existsSync(dataPath);

export const getAllHscodes = (): HscodeItem[] => {
  if (!hasHscodeData()) return [];
  const raw = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(raw) as HscodeItem[];
};

export const findBySlug = (slug: string) => {
  const all = getAllHscodes();
  return all.find((item) => item.slug === slug);
};

export const getRelatedByChapter = (hsCode: string, limit = 10) => {
  const chapter = hsCode.slice(0, 2);
  return getAllHscodes()
    .filter((item) => item.hs_code.startsWith(chapter))
    .slice(0, limit);
};

export const getChapterCodes = () => {
  const chapters = new Set<string>();
  getAllHscodes().forEach((item) => {
    if (item.hs_code.length >= 2) {
      chapters.add(item.hs_code.slice(0, 2));
    }
  });
  return Array.from(chapters).sort();
};
