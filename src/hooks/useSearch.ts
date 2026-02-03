import { useMemo } from "react";
import Fuse from "fuse.js";
import type { HscodeItem } from "@/lib/hscode";
import data from "@/data/hscode.json";

const hscodes = data as HscodeItem[];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const expandVariants = (term: string) => {
  const variants = new Set([term]);
  if (term.includes("tire")) variants.add(term.replace(/tire/g, "tyre"));
  if (term.includes("tyre")) variants.add(term.replace(/tyre/g, "tire"));
  return Array.from(variants);
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const STOPWORDS = new Set(["or", "and", "not", "the", "of", "for", "to", "in", "on", "at", "whether", "if", "a", "an"]);
const meaningfulWords = (normalized: string) =>
  normalized.split(/\s+/).filter((w) => w.length >= 2 && !STOPWORDS.has(w));

/** Prefer results where query words appear as whole words (e.g. "tea" not inside "stearic"). */
const wholeWordMatches = (words: string[], items: HscodeItem[]): HscodeItem[] =>
  words.length === 0
    ? []
    : items.filter((item) =>
        words.some(
          (w) =>
            new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(item.name_en) ||
            new RegExp(`\\b${escapeRegex(w)}\\b`, "i").test(item.name_vi)
        )
      );

/** Digits-only part of query for 2-, 4-, or 6-digit prefix search (like US HTS). */
const digitsOnly = (q: string) => q.replace(/\D/g, "");
/** True if query is only digits (and optional spaces), so we do prefix match. */
const isDigitsOnlyQuery = (q: string) => q.replace(/\s/g, "") === digitsOnly(q) && digitsOnly(q).length > 0;

export const useSearch = (query: string) => {
  const fuse = useMemo(
    () =>
      new Fuse(hscodes, {
        keys: ["hs_code", "name_vi", "name_en"],
        threshold: 0.3,
        includeScore: false,
        ignoreLocation: true
      }),
    []
  );

  return useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const prefix = digitsOnly(trimmed);
    if (isDigitsOnlyQuery(trimmed) && prefix.length >= 2 && prefix.length <= 6) {
      const prefixMatches = hscodes.filter((item) => item.slug.startsWith(prefix));
      if (prefixMatches.length > 0) return prefixMatches.slice(0, 20);
    }
    const normalized = normalizeText(query);
    if (!normalized) return [];
    const words = meaningfulWords(normalized);
    const wordBoundaryItems = wholeWordMatches(words, hscodes).slice(0, 20);
    const variants = expandVariants(normalized);
    const merged = new Map<string, HscodeItem>();
    wordBoundaryItems.forEach((item) => merged.set(item.slug, item));
    variants.forEach((term) => {
      fuse.search(term).slice(0, 15).forEach((hit) => {
        if (!merged.has(hit.item.slug)) merged.set(hit.item.slug, hit.item);
      });
    });
    return Array.from(merged.values()).slice(0, 10);
  }, [query, fuse]);
};
