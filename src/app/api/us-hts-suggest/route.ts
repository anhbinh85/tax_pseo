import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import Fuse from "fuse.js";
import { getAllUsHtsData } from "@/lib/us-data";

export const runtime = "nodejs";

type HtsSuggestion = {
  hts_code: string;
  reason: string;
};

const groqVisionModel = process.env.GROQ_VISION_MODEL;
const groqTextModel = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const LIMIT = 10;

const describeImage = async (imageDataUrl: string, model: string) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "";
  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Describe the product in this image in under 30 words. " +
              "Include type, material, and use. Focus on terms useful for tariff classification."
          },
          {
            type: "image_url",
            image_url: { url: imageDataUrl }
          }
        ]
      }
    ],
    temperature: 0.2,
    max_tokens: 120
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
};

const parseJsonSafe = (value: string) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    const fenced = value.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]) as unknown;
      } catch {
        return {};
      }
    }
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(value.slice(start, end + 1)) as unknown;
      } catch {
        return {};
      }
    }
    return {};
  }
};

/** Normalize to 8 or 10 digits only. */
const normalizeHtsCode = (s: string): string => s.replace(/\D/g, "").slice(0, 10);
const toHtsCode = (s: string): string => {
  const digits = normalizeHtsCode(s);
  return digits.length >= 10 ? digits.slice(0, 10) : digits.length >= 8 ? digits.slice(0, 8) : digits;
};

/** When query suggests fish/live fish, boost 0301. */
function getChapterBoostPrefixes(q: string): string[] {
  const lower = q.toLowerCase();
  if (/\bfish\b/.test(lower) || /\blive\s*fish\b/.test(lower) || /\baquarium\b/.test(lower) || /\bdiscus\b/.test(lower)) return ["0301"];
  if (/\blive\b/.test(lower)) return ["0301"];
  return [];
}

function searchUsHts(query: string): Array<{ slug: string; display_code: string; description: string }> {
  const data = getAllUsHtsData();
  if (data.length === 0) return [];
  const fuse = new Fuse(data, {
    keys: ["slug", "display_code", "description"],
    threshold: 0.45,
    ignoreLocation: true,
  });
  const prefixes = getChapterBoostPrefixes(query);
  const seen = new Set<string>();
  const results: Array<{ slug: string; display_code: string; description: string }> = [];

  for (const prefix of prefixes) {
    for (const item of data) {
      if (!item.slug.startsWith(prefix) || seen.has(item.slug)) continue;
      seen.add(item.slug);
      results.push({ slug: item.slug, display_code: item.display_code, description: item.description });
      if (results.length >= 6) break;
    }
    if (results.length >= 6) break;
  }

  for (const h of fuse.search(query).slice(0, LIMIT)) {
    if (seen.has(h.item.slug)) continue;
    seen.add(h.item.slug);
    results.push({
      slug: h.item.slug,
      display_code: h.item.display_code,
      description: h.item.description,
    });
    if (results.length >= LIMIT) break;
  }
  return results;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    description?: string;
    imageDataUrl?: string;
  };
  const description = body.description?.trim() ?? "";
  const imageDataUrl = body.imageDataUrl?.trim();

  if (!description && !imageDataUrl) {
    return NextResponse.json(
      { suggestions: [], results: [], error: "Provide description and/or image" },
      { status: 400 }
    );
  }

  let imageHint = "";

  if (imageDataUrl) {
    if (!groqVisionModel || !process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { suggestions: [], results: [], error: "Image lookup not configured" },
        { status: 503 }
      );
    }
    try {
      imageHint = await describeImage(imageDataUrl, groqVisionModel);
    } catch {
      return NextResponse.json(
        { suggestions: [], results: [], error: "Vision model error" },
        { status: 502 }
      );
    }
  }

  const searchText = [description, imageHint].filter(Boolean).join(" ").trim();
  if (!searchText) {
    return NextResponse.json({ suggestions: [], results: [], imageHint: imageHint || null });
  }

  if (!process.env.GROQ_API_KEY) {
    const results = searchUsHts(description || searchText);
    return NextResponse.json({
      suggestions: [],
      results,
      imageHint: imageHint || null,
    });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt =
    "You are a US Harmonized Tariff Schedule (HTS) classification assistant. " +
    "Given a product description, suggest up to 5 most likely US HTS codes (8- or 10-digit, digits only). " +
    "Return ONLY valid JSON with this shape: " +
    '{"suggestions":[{"hts_code":"08061000","reason":"dried grapes"}]}. ' +
    "Use correct chapter: dried fruit → 08, live fish → 03, footwear → 64, etc. " +
    "Keep reason under 15 words. " +
    "Product input:\n" + searchText;

  const extract = (payload: unknown): HtsSuggestion[] => {
    if (!payload || typeof payload !== "object") return [];
    const obj = payload as { suggestions?: HtsSuggestion[] };
    if (Array.isArray(obj.suggestions)) return obj.suggestions;
    return [];
  };

  try {
    const completion = await groq.chat.completions.create({
      model: groqTextModel,
      messages: [
        { role: "system", content: "Return only valid JSON. Do not include markdown or extra text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseJsonSafe(raw);
    let suggestions = extract(parsed)
      .filter((s) => s.hts_code && s.reason)
      .map((s) => ({
        hts_code: toHtsCode(s.hts_code),
        reason: (s.reason || "").slice(0, 80),
      }))
      .filter((s) => s.hts_code.length === 8 || s.hts_code.length === 10);

    if (suggestions.length === 0) {
      const retry = await groq.chat.completions.create({
        model: groqTextModel,
        messages: [
          { role: "system", content: "Return only valid JSON. Do not include markdown or extra text." },
          {
            role: "user",
            content:
              "Return JSON: {\"suggestions\":[{\"hts_code\":\"8 or 10 digits\",\"reason\":\"short reason\"}]}. " +
              "US HTS codes for this product: " + searchText,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      });
      const retryRaw = retry.choices[0]?.message?.content ?? "";
      suggestions = extract(parseJsonSafe(retryRaw))
        .filter((s) => s.hts_code && s.reason)
        .map((s) => ({
          hts_code: toHtsCode(s.hts_code),
          reason: (s.reason || "").slice(0, 80),
        }))
        .filter((s) => s.hts_code.length === 8 || s.hts_code.length === 10);
    }

    const seen = new Set<string>();
    const deduped = suggestions.filter((s) => {
      const key = s.hts_code;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      suggestions: deduped.slice(0, 5),
      results: [],
      imageHint: imageHint || null,
    });
  } catch {
    const results = searchUsHts(description || searchText);
    return NextResponse.json({
      suggestions: [],
      results,
      imageHint: imageHint || null,
    });
  }
}
