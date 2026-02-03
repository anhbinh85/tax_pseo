import { NextResponse } from "next/server";
import Fuse from "fuse.js";
import { getAllUsHtsData } from "@/lib/us-data";

const LIMIT = 15;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const STOPWORDS = new Set(["or", "and", "not", "the", "of", "for", "to", "in", "on", "at", "whether", "if", "a", "an"]);
/** Meaningful words for whole-word boost (e.g. "tea" not inside "teak" or "stearic"). */
function meaningfulWords(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

/** When query suggests "fish", boost chapter 03 (and 0301 live fish) by merging prefix matches. */
function getChapterBoostPrefixes(q: string): string[] {
  const lower = q.toLowerCase();
  if (/\bfish\b/.test(lower) || /\blive\s*fish\b/.test(lower) || /\baquarium\b/.test(lower)) return ["0301"];
  if (/\blive\b/.test(lower)) return ["0301"];
  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().slice(0, 100);
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const data = getAllUsHtsData();
  if (data.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const fuse = new Fuse(data, {
    keys: ["slug", "display_code", "description"],
    threshold: 0.4,
    ignoreLocation: true,
  });

  const hits = fuse.search(q).slice(0, LIMIT);
  const seen = new Set<string>();
  const results: Array<{ slug: string; display_code: string; description: string }> = [];

  const digitsOnly = q.replace(/\D/g, "");
  if ((digitsOnly.length === 4 || digitsOnly.length === 6) && digitsOnly === q.trim()) {
    const hasHeading = data.some((item) => item.slug.startsWith(digitsOnly));
    if (hasHeading) {
      const displayCode = digitsOnly.length === 4
        ? `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`
        : `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4)}`;
      results.push({
        slug: digitsOnly,
        display_code: displayCode,
        description: "Heading — view all subheadings",
      });
      seen.add(digitsOnly);
    }
  }

  const prefixes = getChapterBoostPrefixes(q);
  for (const prefix of prefixes) {
    for (const item of data) {
      if (!item.slug.startsWith(prefix) || seen.has(item.slug)) continue;
      seen.add(item.slug);
      results.push({
        slug: item.slug,
        display_code: item.display_code,
        description: item.description,
      });
      if (results.length >= 6) break;
    }
    if (results.length >= 6) break;
  }

  const words = meaningfulWords(q);
  if (words.length > 0) {
    const wordBoundaryMatches = data.filter((item) =>
      words.some((w) => new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(item.description))
    );
    for (const item of wordBoundaryMatches) {
      if (seen.has(item.slug)) continue;
      seen.add(item.slug);
      results.push({
        slug: item.slug,
        display_code: item.display_code,
        description: item.description,
      });
      if (results.length >= LIMIT) break;
    }
  }

  for (const h of hits) {
    if (seen.has(h.item.slug)) continue;
    seen.add(h.item.slug);
    results.push({
      slug: h.item.slug,
      display_code: h.item.display_code,
      description: h.item.description,
    });
    if (results.length >= LIMIT) break;
  }

  return NextResponse.json({ results });
}
