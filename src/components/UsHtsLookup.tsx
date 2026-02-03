"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SearchResult = {
  slug: string;
  display_code: string;
  description: string;
};

type HtsSuggestion = {
  hts_code: string;
  reason: string;
};

const DEBOUNCE_MS = 200;
const MAX_IMAGE_MB = 5;
const SUPPORTED_IMAGE = [".jpg", ".jpeg", ".png", ".webp"];
const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp";

export const UsHtsLookup = () => {
  const [query, setQuery] = useState("");
  const [textResults, setTextResults] = useState<SearchResult[]>([]);
  const [aiDescription, setAiDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [suggestCodes, setSuggestCodes] = useState<HtsSuggestion[]>([]);
  const [imageHint, setImageHint] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Section 1: Live lookup from JSON (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setTextResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/us-hts-search?q=${encodeURIComponent(query)}`
        );
        const data = (await res.json()) as { results?: SearchResult[] };
        setTextResults(data.results ?? []);
      } catch {
        setTextResults([]);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageDataUrl(null);
    setImageFileName(null);
    setSuggestCodes([]);
    setImageHint(null);
    setError(null);
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!SUPPORTED_IMAGE.some((ext) => name.endsWith(ext))) {
      setError(`Use ${SUPPORTED_IMAGE.join(", ")} only.`);
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_IMAGE_MB}MB.`);
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSuggestSubmit = useCallback(async () => {
    const description = (aiDescription.trim() || query.trim()) || undefined;
    if (!description && !imageDataUrl) return;
    setLoading(true);
    setError(null);
    setSuggestCodes([]);
    setImageHint(null);
    try {
      const res = await fetch("/api/us-hts-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description || undefined,
          imageDataUrl: imageDataUrl || undefined,
        }),
      });
      const data = (await res.json()) as {
        suggestions?: HtsSuggestion[];
        results?: SearchResult[];
        imageHint?: string | null;
        error?: string;
      };
      if (!res.ok) {
        const msg =
          res.status === 503
            ? "AI suggestion is not configured. Use database lookup above or contact support."
            : data.error ?? "Request failed";
        setError(msg);
        return;
      }
      setSuggestCodes(data.suggestions ?? []);
      setImageHint(data.imageHint ?? null);
    } catch {
      setError("Request failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, [aiDescription, query, imageDataUrl]);

  const handleClearAll = useCallback(() => {
    setQuery("");
    setAiDescription("");
    setImageDataUrl(null);
    setImageFileName(null);
    setTextResults([]);
    setSuggestCodes([]);
    setImageHint(null);
    setError(null);
  }, []);

  const handleClearAi = useCallback(() => {
    setAiDescription("");
    setImageDataUrl(null);
    setImageFileName(null);
    setSuggestCodes([]);
    setImageHint(null);
    setError(null);
  }, []);

  const hasDbResults = textResults.length > 0 && query.trim().length > 0;
  const hasAiSuggestions = suggestCodes.length > 0;

  return (
    <div className="space-y-8">
      {/* Section 1: Lookup from JSON (HTS database) */}
      <section aria-labelledby="us-hts-db-heading">
        <h2 id="us-hts-db-heading" className="text-base font-semibold text-slate-800">
          1. Lookup from HTS database
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Type an HTS code (4-, 6-, 8-, or 10-digit) or product wording. Results update as you type.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="us-hts-q" className="sr-only">
              HTS code or product description
            </label>
            <input
              id="us-hts-q"
              type="text"
              placeholder="e.g. 4011 or car tires, tea"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && textResults[0]) {
                  e.preventDefault();
                  router.push(`/us-hts/${textResults[0].slug}`);
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
        {hasDbResults && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
              Results from database
            </div>
            <ul className="divide-y divide-slate-100">
              {textResults.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/us-hts/${item.slug}`}
                    className="block px-4 py-3 text-sm hover:bg-slate-50"
                  >
                    <span className="font-mono font-semibold text-slate-900">
                      {item.display_code}
                    </span>{" "}
                    <span className="text-slate-600">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Section 2: AI HTS suggestion (description and/or image) */}
      <section aria-labelledby="us-hts-ai-heading" className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <h2 id="us-hts-ai-heading" className="text-base font-semibold text-slate-800">
          2. AI HTS suggestion
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter a product description and/or upload an image. If both are provided, AI uses both. Then click <strong>Get AI suggestion</strong>.
        </p>
        <div className="mt-3">
          <label htmlFor="us-hts-ai-desc" className="block text-sm font-medium text-slate-700">
            Product description (optional)
          </label>
          <textarea
            id="us-hts-ai-desc"
            rows={3}
            placeholder="e.g. dried fruit, coffee maker, live fish"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            Upload image
            <input
              type="file"
              accept={ACCEPT_IMAGE}
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
          <button
            type="button"
            onClick={handleSuggestSubmit}
            disabled={(!aiDescription.trim() && !query.trim() && !imageDataUrl) || loading}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 shadow-sm hover:bg-amber-400 disabled:bg-slate-300 disabled:text-slate-500"
          >
            {loading ? "Getting suggestion…" : "Get AI suggestion"}
          </button>
          <button
            type="button"
            onClick={handleClearAi}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Max image size {MAX_IMAGE_MB}MB. Supported: {SUPPORTED_IMAGE.join(", ")}.
        </p>
        {imageDataUrl && imageFileName && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-900" role="status">
            ✓ Image uploaded: <span className="font-medium">{imageFileName}</span>. Click &quot;Get AI suggestion&quot;.
          </div>
        )}
        {imageHint && (
          <div className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold">Image hint:</span> {imageHint}
          </div>
        )}
        {error && (
          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {hasAiSuggestions && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
              AI suggested HTS code(s)
            </div>
            <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
              Click a code to view duty rates, or type it in the search box above.
            </p>
            <ul className="divide-y divide-slate-100">
              {suggestCodes.map((item) => (
                <li key={item.hts_code}>
                  <Link
                    href={`/us-hts/${item.hts_code}`}
                    className="block px-4 py-3 text-sm hover:bg-slate-50"
                  >
                    <span className="font-mono font-semibold text-slate-900">
                      {item.hts_code}
                    </span>
                    {item.reason && (
                      <span className="ml-2 text-slate-600">— {item.reason}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
