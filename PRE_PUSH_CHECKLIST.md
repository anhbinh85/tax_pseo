# Pre-push checklist (tests, static count, ISR, pSEO/SEO)

Use this after major changes and before pushing to git.

---

## 1. Test all functions

### Build & type-check
```bash
npm run build
```
- **Fixed in this pass:** ESLint unused `displayCode` in `GlobalDutyMatrix.tsx` (now used in subtitle). Type guard for `item` in `us-hts/[slug]/page.tsx` `generateMetadata`.
- Build compiles, lints, and runs static generation. Expect ~4,800 static pages (4k US HTS + 500 VN HS + index/chapter/disclaimer/contact).

### Manual smoke tests (recommended)
- **Home:** `/vi`, `/en` — hero, search bar, US HTS CTA, Browse by Chapter (VN HS | US HTS tabs).
- **VN HS:** Search an HS code → `/vi/hs-code/{slug}` and `/en/hs-code/{slug}` — tax table, AI insight, Global Duty Matrix, related links.
- **US HTS:** `/us-hts` — search by code (4/6/8/10 digits) and by text; image upload → AI suggestions; redirect to `/us-hts/{slug}`.
- **US HTS detail:** `/us-hts/8517130000` (or any 10-digit slug) — duty matrix, Vietnam link when VN slug exists.
- **4/6-digit heading:** `/us-hts/4011` or `/us-hts/401110` — heading page with list of subheadings.
- **Chapter browse:** VN: `/vi/chapter/84`, `/en/chapter/84`; US: `/us-hts/chapter/84`.
- **Disclaimer:** `/vi/disclaimer`, `/en/disclaimer` — linked from footer.
- **Contact:** `/vi/contact`, `/en/contact` — form and metadata.

---

## 2. How many static pages in total?

Approximate counts (from current data):

| Source | Count | Notes |
|--------|--------|--------|
| Root / locale / US HTS index | 3 | `/vi`, `/en`, `/us-hts` |
| Disclaimer + Contact | 4 | `/vi/disclaimer`, `/en/disclaimer`, `/vi/contact`, `/en/contact` |
| US HTS detail `[slug]` | **4,000** (capped) | `generateStaticParams` returns first 4,000 slugs; remaining ~23k are on-demand with ISR |
| US HTS chapter | 97 | `/us-hts/chapter/[chapter]` |
| VN chapter (vi + en) | 2 × 97 = 194 | `/vi/chapter/{c}`, `/en/chapter/{c}` |
| VN HS detail `[slug]` | **500** (first 250 × vi/en) | `generateStaticParams` returns first 250 slugs × 2 locales; rest on-demand + ISR |

**Total pre-rendered at build:** ~**4,798** (3 + 4 + 4,000 + 97 + 194 + 500). Sitemap includes all of the above plus full US HTS slug list and VN HS slug list for discovery.

**Total URLs in sitemap:** unchanged (all US HTS + VN HS URLs); pages beyond prebuild are generated on first request, then cached with ISR.

**US HTS cap:** 4,000 pre-built; remaining ~23k US HTS pages are on-demand with ISR.

**VN HS prebuild:** First 250 slugs × 2 locales (vi/en) = 500 pages via `VN_HS_PREBUILD_LIMIT = 250` in `[lang]/hs-code/[slug]/page.tsx`; rest on-demand + ISR.

---

## 3. Is ISR still maintained?

Yes.

| Route | Revalidate | Behavior |
|-------|------------|----------|
| `/[lang]/hs-code/[slug]` | `60 * 60 * 24` (24h) | First 2k×2 pre-built; rest on-demand then cached 24h |
| `/us-hts/[slug]` | `60 * 60 * 24` (24h) | First 5k pre-built; rest on-demand then cached 24h |
| Chapter pages | (none) | Fully static until next build |
| Home, disclaimer, contact, `/us-hts` | (none) | Static |

`dynamicParams = true` on both slug pages: unknown slugs are still generated at runtime and then revalidated every 24h.

---

## 4. pSEO & SEO recheck and improvements

### Done in this pass
- **Sitemap:** Added `/vi/disclaimer`, `/en/disclaimer`, `/vi/contact`, `/en/contact`, and all `/us-hts/chapter/[chapter]` URLs.
- **GlobalDutyMatrix:** Uses `displayCode` in the copy (no unused prop).
- **VN HS generateStaticParams:** First 2,000 slugs × vi/en pre-built; constant `VN_HS_PREBUILD_LIMIT` in `[lang]/hs-code/[slug]/page.tsx`.
- **US HTS cap:** Kept at 5,000 (Vercel-friendly); rest on ISR.
- **Open Graph images:** Root layout default `/hero-bg.jpg`; [lang] layout (home), `/us-hts`, `/us-hts/[slug]`, `[lang]/hs-code/[slug]` all set `openGraph.images` with 1200×630.
- **JSON-LD:** Root layout has `WebSite` schema. Home (`/vi`, `/en`), `/us-hts`, VN HS detail, and US HTS detail have `WebPage` + `BreadcrumbList`. VN HS detail keeps existing `Product` schema.

### Already in place
- **Metadata:** All main pages use `generateMetadata` (or static `metadata`) with title and description.
- **Canonical:** Set on VN HS, US HTS, chapter, disclaimer, contact.
- **Hreflang:** VN HS, chapter, disclaimer, contact use `alternates.languages` (en/vi). US HTS is English-only.
- **Internal linking:** Related HS codes, chapter lists, Browse by Chapter.
- **Robots:** `robots.ts` allows all and points to `/sitemap.xml`.
- Ensure `NEXT_PUBLIC_SITE_URL` is set in production so canonicals, sitemap, and OG/JSON-LD use the real domain.

---

## 5. SEO quick verification (before push)

### robots.txt
- **Route:** `src/app/robots.ts` → served at `/robots.txt`.
- **Rules:** `User-agent: *` → `Allow: /`; `Sitemap: {siteUrl}/sitemap.xml`.
- **Fallback:** `siteUrl` defaults to `https://vietnamhs.info` when `NEXT_PUBLIC_SITE_URL` is unset.

### Sitemap
- **Route:** `src/app/sitemap.ts` → served at `/sitemap.xml`.
- **Fallback:** `siteUrl` defaults to `https://vietnamhs.info` so sitemap URLs are valid when building for production.
- **Includes:** `/vi`, `/en`, `/us-hts`, disclaimer & contact (vi/en), all US HTS slugs & chapter URLs, all VN chapter URLs (vi/en), all VN HS detail URLs (vi/en). All entries use absolute URLs with `lastModified`.

### Headings (one H1 per page, logical H2/H3)
| Page | H1 | H2 / sections |
|------|----|----------------|
| `/[lang]` (home) | Vietnam Import Tax & HS Code Portal | US HTS Lookup, Browse by Chapter |
| `/us-hts` | US HTS Import Duty Lookup | Global Sourcing Matrix, Vietnam HS Code Lookup |
| `/us-hts/[slug]` | Code/heading title | Product details, duty matrix |
| `/us-hts/chapter/[chapter]` | US HTS Chapter XX: {title} | — |
| `/[lang]/chapter/[chapter]` | Chapter XX / Chương XX | — |
| `/[lang]/hs-code/[slug]` | {name} ({hs_code}) | Additional Taxes & Policy, Related, etc. |
| `/[lang]/disclaimer` | Disclaimer / Tuyên bố miễn trừ | Data sources, AI content, Author, Questions |
| `/[lang]/contact` | Let's talk / Liên hệ tư vấn | — |

Components that render inside pages (UsHtsLookup, TaxTable, etc.) use **H2** or **H3** for section titles so each full page has exactly one H1.

### After build
- Open `/robots.txt` and `/sitemap.xml` (e.g. `http://localhost:3000/robots.txt`) and confirm URLs use the correct domain when `NEXT_PUBLIC_SITE_URL` is set.
- For production: set `NEXT_PUBLIC_SITE_URL=https://vietnamhs.info` (or your domain) in Vercel so canonicals, OG, and sitemap point to the live site.

---

*Last updated: pre-push verification (build, static count, ISR, sitemap/SEO, robots, headings).*
