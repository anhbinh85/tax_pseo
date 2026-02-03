# Next-Year Update Guide

Use this checklist each year (or when new data is published) to update the data and year labeling with minimal SEO impact. **The code is ready for this:** all data is read from files in `Ref/` and scripts output to `src/data/`. No code changes are required unless the source file format changes.

---

## Part A: Vietnam HS Code (VN HS)

### 1) Update the year (one change)
- Edit `.env`:
  - `NEXT_PUBLIC_SITE_YEAR=2027`

### 2) Update VN HS data file names (match the script pattern)
Scripts derive file names from `NEXT_PUBLIC_SITE_YEAR`.

**Expected XLSX filename pattern:**
- `Ref/BIEU THUE XNK {YEAR} UPDATE 07.01.{YY}.xlsx`

**Expected CSV filename pattern:**
- `Ref/BIEU THUE XNK {YEAR} UPDATE 07.01.{YY}.xlsx - BT{YEAR}.csv`

**Sheet name expected:**
- `BT{YEAR}` (e.g., `BT2027`)

If your official file name differs, either:
- Rename the file to match the pattern, or
- Ask to make the filename configurable in `.env`.

### 3) Convert XLSX → CSV (VN HS)
Run from **project root**:
```bash
npm run convert-xlsx
```

### 4) Process CSV → JSON (VN HS)
Run from **project root**:
```bash
npm run process-data
```
This regenerates `src/data/hscode.json` for SSG and for the VN HS search (including 2-, 4-, and 6-digit prefix search).

### 5) Rebuild embeddings (optional)
If you use semantic search:
```bash
npm run build-embeddings
```

---

## Part B: US HTS

### 6) Get new US HTS source (optional each year)
US HTS data is read from `Ref/hts-ref/us-hts.json`. To refresh:

**Option A – Download from USITC:**
```bash
npm run download-us-hts
```
This fetches the current edition (or a known fallback URL) and overwrites `Ref/hts-ref/us-hts.json`.

**Option B – Manual:**  
Place a new `us-hts.json` in `Ref/hts-ref/` (same structure as the current file; see `scripts/process-us-data.ts` for the expected shape).

### 7) Process US HTS JSON → app data
Run from **project root**:
```bash
npm run process-us-data
```
This regenerates `src/data/us-hts-processed.json` (used by US HTS lookup, chapter browse, and Global Sourcing Matrix).

---

## Part C: Build & deploy

### 8) Build & check
Run from **project root**:
```bash
npm run build
```
Expect ~9.3k static pages. Fix any lint/type or prerender errors.

### 9) SEO safeguards
- URLs remain the same; only year text (and data) changes.
- Sitemap updates automatically at `/sitemap.xml`.
- Re-submit sitemap in Search Console after deploy.

### 10) Deploy
Deploy as usual (e.g. Vercel).

---

## If the source format changes

- **VN HS (CSV):** Update column names/indices in `scripts/process-data.ts` (see `.cursorrules` for column mapping).
- **US HTS (JSON):** If USITC changes the JSON structure, update parsing in `scripts/process-us-data.ts` and the types in `src/lib/us-data.ts`.
