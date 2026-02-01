import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import casData from "@/data/cas.json";

export const runtime = "nodejs";

type CasItem = {
  cas: string;
  name_vi: string;
  name_en: string;
  hs_code?: string;
  formula?: string;
};

type Suggestion = {
  cas: string;
  name_vi?: string;
  name_en?: string;
  hs_code?: string;
  formula?: string;
  reason: string;
};

const casList = casData as CasItem[];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

const scoreMatches = (query: string) => {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(" ").filter(Boolean);
  const minHits = Math.min(3, tokens.length);

  const scored = casList
    .map((item) => {
      const name = normalize(`${item.name_vi} ${item.name_en}`);
      let hits = 0;
      tokens.forEach((token) => {
        if (name.includes(token)) hits += 1;
      });
      const ratio = tokens.length ? hits / tokens.length : 0;
      const fullMatch = name.includes(q);
      return { item, hits, ratio, fullMatch };
    })
    .filter((entry) => entry.fullMatch || (entry.hits >= minHits && entry.ratio >= 0.6))
    .sort((a, b) => {
      if (a.fullMatch !== b.fullMatch) return a.fullMatch ? -1 : 1;
      if (a.hits !== b.hits) return b.hits - a.hits;
      return b.ratio - a.ratio;
    });

  return scored.map((entry) => entry.item).slice(0, 5);
};

export async function POST(request: Request) {
  const body = (await request.json()) as { query?: string };
  const query = body.query?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ suggestions: [] }, { status: 400 });
  }

  const matches = scoreMatches(query);
  if (matches.length > 0) {
    const suggestions = matches.map((item) => ({
      cas: item.cas,
      name_vi: item.name_vi,
      name_en: item.name_en,
      hs_code: item.hs_code,
      formula: item.formula,
      reason: "Matched from CAS list"
    }));
    return NextResponse.json({ suggestions, source: "local" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { suggestions: [] },
      { status: 503, statusText: "Missing GROQ_API_KEY" }
    );
  }

  const groq = new Groq({ apiKey });
  const prompt =
    "You are a chemistry assistant. " +
    "Given a chemical name, return up to 5 likely CAS numbers. " +
    "Return ONLY JSON with this shape: " +
    '{"suggestions":[{"cas":"50-00-0","name_en":"Formaldehyde","name_vi":"Formaldehyde","reason":"..."}]}. ' +
    "Keep reasons under 16 words. " +
    "Query: " +
    query;

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "Return only valid JSON. No markdown or extra text."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 300
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = parseJsonSafe(raw);
  const extractSuggestions = (payload: unknown): Suggestion[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload as Suggestion[];
    if (typeof payload === "object") {
      const obj = payload as { suggestions?: Suggestion[]; cas?: string };
      if (Array.isArray(obj.suggestions)) return obj.suggestions;
      if (obj.cas) return [obj as Suggestion];
    }
    return [];
  };

  let safeSuggestions = extractSuggestions(parsed).filter(
    (item) => item.cas && (item.name_en || item.name_vi)
  );

  if (safeSuggestions.length === 0) {
    const retry = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Return only valid JSON array. No markdown or extra text."
        },
        {
          role: "user",
          content:
            "Return a JSON array of up to 5 objects with fields: cas, name_en, name_vi, reason. Query: " +
            query
        }
      ],
      temperature: 0.2,
      max_tokens: 300
    });
    const retryRaw = retry.choices[0]?.message?.content ?? "";
    const retryParsed = parseJsonSafe(retryRaw);
    safeSuggestions = extractSuggestions(retryParsed).filter(
      (item) => item.cas && (item.name_en || item.name_vi)
    );
  }

  return NextResponse.json({
    suggestions: safeSuggestions.slice(0, 5),
    source: "groq"
  });
}
