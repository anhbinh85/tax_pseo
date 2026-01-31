import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

type RawRow = string[];

const normalizeHeader = (value: string | undefined) =>
  (value ?? "")
    .toString()
    .replace(/\s+/g, " ")
    .trim();

const sourcePath = path.join(
  process.cwd(),
  "Ref",
  "BIEU THUE XNK 2026 UPDATE 07.01.26.xlsx - BT2026.csv"
);
const outputPath = path.join(process.cwd(), "src", "data", "hscode.json");

const normalizeValue = (value: string | undefined) => {
  const cleaned = (value ?? "").toString().trim();
  if (!cleaned || cleaned === "-") return null;
  return cleaned;
};

const ensureOutputDir = () => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const main = () => {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Missing CSV file at: ${sourcePath}`);
    process.exit(1);
  }

  const rawCsv = fs.readFileSync(sourcePath, "utf-8");
  const allRows = parse(rawCsv, {
    columns: false,
    relax_column_count: true,
    trim: false
  }) as RawRow[];

  const headers = (allRows[2] ?? []).map(normalizeHeader);
  const getHeaderIndex = (label: string, fallback: number) => {
    const idx = headers.findIndex((header) => header === label);
    return idx === -1 ? fallback : idx;
  };

  const nkTtIndex = getHeaderIndex("NK TT", 10);
  const mfnIndex = getHeaderIndex("NK ưu đãi", 13);
  const vatIndex = getHeaderIndex("VAT", 16);
  const unitIndex = getHeaderIndex("Unit of quantity", 9);
  const exciseIndex = getHeaderIndex("TT ĐB", 81);
  const exportIndex = getHeaderIndex("XK", 84);
  const exportCptppIndex = getHeaderIndex("XK CP TPP", 87);
  const exportEvIndex = getHeaderIndex("XK EV", 90);
  const exportUkvIndex = getHeaderIndex("XK UKV", 93);
  const envTaxIndex = getHeaderIndex("Thuế BV MT", 96);
  const policyIndex = getHeaderIndex("Chính sách mặt hàng theo mã HS", 99);
  const vatReduceIndex = getHeaderIndex("Giảm VAT", 100);

  const ftaColumns = [
    { key: "form_e", label: "ACFTA" },
    { key: "form_d", label: "ATIGA" },
    { key: "ajcep", label: "AJCEP" },
    { key: "vjepa", label: "VJEPA" },
    { key: "akfta", label: "AKFTA" },
    { key: "aanzfta", label: "AANZFTA" },
    { key: "aifta", label: "AIFTA" },
    { key: "vkfta", label: "VKFTA" },
    { key: "vcfta", label: "VCFTA" },
    { key: "vn_eaeu", label: "VN-EAEU" },
    { key: "cptpp", label: "CPTPP" },
    { key: "ahkfta", label: "AHKFTA" },
    { key: "vncu", label: "VNCU" },
    { key: "eur1", label: "EVFTA" },
    { key: "ukv", label: "UKVFTA" },
    { key: "vn_lao", label: "VN-LAO" },
    { key: "vifta", label: "VIFTA" },
    { key: "rcept", label: "RCEPT" }
  ].map((entry) => ({
    ...entry,
    index: getHeaderIndex(entry.label, -1)
  }));

  const records = allRows.slice(8).filter((row) => row.length > 0);
  const seenCodes = new Set<string>();

  const data = records
    .map((row) => {
      const hsCode = (row[5] ?? "").toString().trim();
      if (!hsCode) return null;

      const cleanCode = hsCode.replace(/[\.\s]/g, "");
      if (!/^\d{8,}$/.test(cleanCode)) return null;
      if (seenCodes.has(cleanCode)) return null;
      seenCodes.add(cleanCode);

      const taxes: Record<string, string> = {};
      const nkTt = normalizeValue(row[nkTtIndex]);
      if (nkTt) taxes.nk_tt = nkTt;
      const mfn = normalizeValue(row[mfnIndex]);
      if (mfn) taxes.mfn = mfn;

      ftaColumns.forEach((fta) => {
        if (fta.index === -1) return;
        const value = normalizeValue(row[fta.index]);
        if (value) taxes[fta.key] = value;
      });

      return {
        hs_code: hsCode,
        slug: cleanCode,
        name_vi: (row[6] ?? "").toString().trim(),
        name_en: (row[7] ?? "").toString().trim(),
        unit: (row[unitIndex] ?? "").toString().trim(),
        vat: normalizeValue(row[vatIndex]),
        excise_tax: normalizeValue(row[exciseIndex]),
        export_tax: normalizeValue(row[exportIndex]),
        export_cptpp: normalizeValue(row[exportCptppIndex]),
        export_ev: normalizeValue(row[exportEvIndex]),
        export_ukv: normalizeValue(row[exportUkvIndex]),
        env_tax: normalizeValue(row[envTaxIndex]),
        policy: normalizeValue(row[policyIndex]),
        vat_reduction: normalizeValue(row[vatReduceIndex]),
        taxes
      };
    })
    .filter(Boolean);

  ensureOutputDir();
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Saved ${data.length} rows to ${outputPath}`);
};

main();
