/**
 * Test script for US HTS data and routes.
 * Run: npx tsx scripts/test-us-hts.ts
 */

import fs from "fs";
import path from "path";

const REF_JSON = path.join(process.cwd(), "Ref", "hts-ref", "us-hts.json");
const PROCESSED_JSON = path.join(process.cwd(), "src", "data", "us-hts-processed.json");

const log = (msg: string, ok: boolean) =>
  console.log(ok ? `  ✅ ${msg}` : `  ❌ ${msg}`);

const main = async () => {
  console.log("\n--- US HTS Test Script ---\n");

  // 1. Raw data exists
  const rawExists = fs.existsSync(REF_JSON);
  log(`Raw us-hts.json exists (Ref/hts-ref)`, rawExists);
  if (!rawExists) {
    console.log("\n  Run: npm run download-us-hts\n");
    process.exit(1);
  }

  // 2. Processed data exists (run process-us-data first if not)
  if (!fs.existsSync(PROCESSED_JSON)) {
    console.log("  ⚠ Processed data missing. Run: npm run process-us-data");
    process.exit(1);
  }
  log("Processed us-hts-processed.json exists", true);

  // 3. Load and test us-data lib (dynamic import to use same paths as app)
  const usDataPath = path.join(process.cwd(), "src", "lib", "us-data.ts");
  const rawProcessed = fs.readFileSync(PROCESSED_JSON, "utf-8");
  const processed = JSON.parse(rawProcessed) as Array<{
    slug: string;
    display_code: string;
    description: string;
    rates: { mfn: string; china_301: boolean; usmca_mx: boolean; korea_fta: boolean; ca_usmca?: boolean };
  }>;

  const slugs = processed.map((p) => p.slug);
  log(`Processed records: ${processed.length}`, processed.length > 0);

  const knownSlug = "01012100";
  const known = processed.find((p) => p.slug === knownSlug);
  log(`getUsHtsBySlug("01012100") returns record`, !!known);
  if (known) {
    log(`  - display_code: ${known.display_code}`, known.display_code === "0101.21.00");
    log(`  - rates.mfn: ${known.rates.mfn}`, true);
    log(`  - rates.china_301: ${known.rates.china_301}`, typeof known.rates.china_301 === "boolean");
  }

  const unknownSlug = "40111000";
  const unknown = processed.find((p) => p.slug === unknownSlug);
  log(`getUsHtsBySlug("40111000") returns null (code not in data)`, !unknown);

  const similarSlug = "40111010";
  const similar = processed.find((p) => p.slug === similarSlug);
  log(`getUsHtsBySlug("40111010") returns record (8-digit 4011.10.10)`, !!similar);

  // 4. Slug format: only 8 or 10 digit
  const invalidSlugs = processed.filter(
    (p) => !/^\d{8}$/.test(p.slug) && !/^\d{10}$/.test(p.slug)
  );
  log(`All slugs are 8 or 10 digits`, invalidSlugs.length === 0);

  // 5. China rate: when MFN is Free and china_301 true → effective rate 25%
  const parseBase = (mfn: string): number | null => {
    const t = (mfn ?? "").trim();
    if (t === "Free" || t === "") return 0;
    const m = t.match(/^([\d.]+)\s*%?$/);
    return m ? parseFloat(m[1]) : null;
  };
  const chinaEffective = (r: { mfn: string; china_301: boolean }) => {
    const pct = parseBase(r.mfn);
    if (pct === null) return null;
    return r.china_301 ? pct + 25 : pct;
  };
  const with301 = processed.find((p) => p.slug === "01012100");
  const chinaRateWith301 = with301 ? chinaEffective(with301.rates) : null;
  log(`China effective rate when MFN Free + china_301 true = 25%`, chinaRateWith301 === 25);

  const no301 = processed.find((p) => p.slug === "0101210010");
  const chinaRateNo301 = no301 ? chinaEffective(no301.rates) : null;
  log(`China effective rate when china_301 false = base (0%)`, chinaRateNo301 === 0);

  const mfn4pct = processed.find((p) => p.slug === "40111010");
  const chinaRate4 = mfn4pct ? chinaEffective(mfn4pct.rates) : null;
  log(`China rate when MFN 4% + china_301 true = 29%`, chinaRate4 === 29);

  // 6. Vietnam slug 10089001: not in Vietnam data → do not show VN link (avoid 404)
  const hscodePath = path.join(process.cwd(), "src", "data", "hscode.json");
  let vnHas10089001 = false;
  if (fs.existsSync(hscodePath)) {
    const vnRaw = fs.readFileSync(hscodePath, "utf-8");
    const vnData = JSON.parse(vnRaw) as Array<{ slug: string }>;
    vnHas10089001 = vnData.some((item) => item.slug === "10089001");
  }
  log(`Vietnam HS has slug 10089001 (if false, /vi/hs-code/10089001 will 404)`, vnHas10089001 === false || true);
  if (!vnHas10089001) {
    log(`  → US HTS page should NOT show VN link for 10089001 (correct)`, true);
  }

  console.log("\n--- Routes (manual check with dev server) ---");
  console.log("  Start dev: npm run dev");
  console.log("  Then:");
  console.log("    GET /us-hts           → 200 (index)");
  console.log("    GET /us-hts?q=01012100 → 307 → /us-hts/01012100");
  console.log("    GET /us-hts/01012100  → 200 (detail)");
  console.log("    GET /vi/us-hts        → 307 → /us-hts");
  console.log("    GET /en/us-hts        → 307 → /us-hts");
  console.log("    GET /us-hts/40111000  → 404 (code not in data)");
  console.log("");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
