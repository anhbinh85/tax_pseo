# Next-Year Update Guide

Use this checklist each year (e.g., 2027) to update the data and year labeling with minimal SEO impact.

## 1) Update the year (one change)
- Edit `.env`:
  - `NEXT_PUBLIC_SITE_YEAR=2027`

## 2) Update data file names (match the script pattern)
The scripts now derive file names from `NEXT_PUBLIC_SITE_YEAR`.

Expected XLSX filename pattern:
- `Ref/BIEU THUE XNK {YEAR} UPDATE 07.01.{YY}.xlsx`

Expected CSV filename pattern:
- `Ref/BIEU THUE XNK {YEAR} UPDATE 07.01.{YY}.xlsx - BT{YEAR}.csv`

Sheet name expected:
- `BT{YEAR}` (e.g., `BT2027`)

If your official file name differs, either:
- Rename the file to match the pattern, or
- Ask to make the filename configurable in `.env`.

## 3) Convert XLSX → CSV
Run:
```
npm run convert-xlsx
```

## 4) Process CSV → JSON
Run:
```
npm run process-data
```

This regenerates `src/data/hscode.json` for SSG.

## 5) Rebuild embeddings (if needed)
Run:
```
npm run build-embeddings
```

## 6) Build & check
Run:
```
npm run build
```

## 7) SEO safeguards
- URLs remain the same, only year text changes.
- Sitemap updates automatically at `/sitemap.xml`.
- Re-submit sitemap in Search Console after deploy.

## 8) Deploy
Deploy as usual (Vercel).

---
If the data format changes, update the CSV parser logic in `scripts/process-data.ts` (column names / indices).
