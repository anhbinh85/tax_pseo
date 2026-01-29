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
    const normalized = normalizeText(query);
    if (!normalized) return [];
    const variants = expandVariants(normalized);
    const merged = new Map<string, HscodeItem>();
    variants.forEach((term) => {
      fuse.search(term).slice(0, 10).forEach((hit) => {
        merged.set(hit.item.slug, hit.item);
      });
    });
    return Array.from(merged.values()).slice(0, 10);
  }, [query, fuse]);
};
