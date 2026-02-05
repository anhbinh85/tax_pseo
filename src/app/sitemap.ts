import { getAllHscodes, getChapterCodes, hasHscodeData } from "@/lib/hscode";
import { getUsHtsChapterCodes } from "@/lib/hts-chapters";
import { hasUsHtsData, getAllUsHtsSlugs } from "@/lib/us-data";
import { SITE_CONFIG } from "@/config/site";
import type { MetadataRoute } from "next";

export const ITEMS_PER_SITEMAP = 2000;
const domain = SITE_CONFIG.domain;

/** Exported for sitemap index route. */
export function getTotalUrlCount(): number {
  let total = 7; // static: vi, en, us-hts, vi/en disclaimer, vi/en contact
  if (hasUsHtsData()) {
    total += getAllUsHtsSlugs().length;
    total += getUsHtsChapterCodes().length;
  }
  if (hasHscodeData()) {
    total += getChapterCodes().length * 2; // vi + en chapter
    total += getAllHscodes().length * 2; // vi + en hs-code
  }
  return total;
}

/** Return only the chunk of entries for the given id (avoids building full list). */
function getChunkEntries(chunkId: number): MetadataRoute.Sitemap {
  const start = chunkId * ITEMS_PER_SITEMAP;
  const end = start + ITEMS_PER_SITEMAP;
  const entries: MetadataRoute.Sitemap = [];
  let offset = 0;

  const now = new Date();

  // Static
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${domain}/vi`, lastModified: now },
    { url: `${domain}/en`, lastModified: now },
    { url: `${domain}/us-hts`, lastModified: now },
    { url: `${domain}/vi/disclaimer`, lastModified: now },
    { url: `${domain}/en/disclaimer`, lastModified: now },
    { url: `${domain}/vi/contact`, lastModified: now },
    { url: `${domain}/en/contact`, lastModified: now },
  ];
  if (start < offset + staticUrls.length) {
    const from = Math.max(0, start - offset);
    const to = Math.min(staticUrls.length, end - offset);
    entries.push(...staticUrls.slice(from, to));
  }
  if (entries.length >= ITEMS_PER_SITEMAP) return entries;
  offset += staticUrls.length;

  // US HTS slugs
  if (hasUsHtsData()) {
    const usSlugs = getAllUsHtsSlugs();
    const n = usSlugs.length;
    if (start < offset + n) {
      const from = Math.max(0, start - offset);
      const to = Math.min(n, end - offset);
      for (let i = from; i < to; i++) {
        entries.push({ url: `${domain}/us-hts/${usSlugs[i]}`, lastModified: now });
      }
    }
    if (entries.length >= ITEMS_PER_SITEMAP) return entries;
    offset += n;
  }

  // US HTS chapter
  if (hasUsHtsData()) {
    const usChapters = getUsHtsChapterCodes();
    const n = usChapters.length;
    if (start < offset + n) {
      const from = Math.max(0, start - offset);
      const to = Math.min(n, end - offset);
      for (let i = from; i < to; i++) {
        entries.push({
          url: `${domain}/us-hts/chapter/${usChapters[i]}`,
          lastModified: now,
        });
      }
    }
    if (entries.length >= ITEMS_PER_SITEMAP) return entries;
    offset += n;
  }

  // VN chapter (vi + en)
  if (hasHscodeData()) {
    const vnChapters = getChapterCodes();
    const n = vnChapters.length * 2;
    if (start < offset + n) {
      const from = Math.max(0, start - offset);
      const to = Math.min(n, end - offset);
      for (let i = from; i < to; i++) {
        const chapter = vnChapters[Math.floor(i / 2)];
        const lang = i % 2 === 0 ? "vi" : "en";
        entries.push({
          url: `${domain}/${lang}/chapter/${chapter}`,
          lastModified: now,
        });
      }
    }
    if (entries.length >= ITEMS_PER_SITEMAP) return entries;
    offset += n;
  }

  // VN HS (vi + en)
  if (hasHscodeData()) {
    const data = getAllHscodes();
    const n = data.length * 2;
    if (start < offset + n) {
      const from = Math.max(0, start - offset);
      const to = Math.min(n, end - offset);
      for (let i = from; i < to; i++) {
        const item = data[Math.floor(i / 2)];
        const lang = i % 2 === 0 ? "vi" : "en";
        entries.push({
          url: `${domain}/${lang}/hs-code/${item.slug}`,
          lastModified: now,
        });
      }
    }
  }

  return entries;
}

export async function generateSitemaps() {
  const total = getTotalUrlCount();
  const totalChunks = Math.ceil(total / ITEMS_PER_SITEMAP);
  return Array.from({ length: Math.max(1, totalChunks) }, (_, i) => ({ id: i }));
}

export default async function sitemap(
  props: { id: string | number }
): Promise<MetadataRoute.Sitemap> {
  const id = typeof props.id === "string" ? parseInt(props.id, 10) : props.id;
  if (Number.isNaN(id) || id < 0) return [];
  return getChunkEntries(id);
}
