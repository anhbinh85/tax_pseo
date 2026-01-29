import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import Fuse from "fuse.js";
import type { HscodeItem } from "@/lib/hscode";
import data from "@/data/hscode.json";

export const runtime = "nodejs";

type Suggestion = {
  hs_code: string;
  name_en: string;
  name_vi: string;
  reason: string;
};

const hscodes = data as HscodeItem[];

const groqTextModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const groqVisionModel = process.env.GROQ_VISION_MODEL;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOPWORDS = new Set([
  "the",
  "and",
  "or",
  "of",
  "for",
  "with",
  "without",
  "from",
  "in",
  "on",
  "to",
  "a",
  "an",
  "by",
  "is",
  "are",
  "loai",
  "hang",
  "hoa",
  "cho",
  "bang",
  "khong",
  "co",
  "va",
  "tu",
  "cua"
]);

const PACKAGING_TOKENS = new Set([
  "box",
  "case",
  "container",
  "packaging",
  "bottle",
  "jar",
  "bag",
  "carton",
  "wrapper",
  "pack"
]);

const INCOMPLETE_TOKENS = new Set([
  "unfinished",
  "unassembled",
  "incomplete",
  "parts",
  "part",
  "kit",
  "set"
]);

const tokenize = (value: string) =>
  normalize(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));

const stripTokens = (value: string, tokensToStrip: Set<string>) => {
  const tokens = normalize(value).split(" ");
  return tokens.filter((token) => !tokensToStrip.has(token)).join(" ").trim();
};

const synonymMap: Record<string, string[]> = {
  tyre: ["tire"],
  tire: ["tyre"],
  truck: ["lorry"],
  lorry: ["truck"],
  passenger: ["motor", "car"],
  car: ["motor", "passenger"],
  firefighting: ["fire", "fighting"],
  fire: ["firefighting"],
  bus: ["coach"],
  suit: ["costume", "wear"],
  costume: ["suit", "mascot"],
  mascot: ["costume"]
};

const expandTokens = (tokens: string[]) => {
  const expanded = new Set(tokens);
  tokens.forEach((token) => {
    (synonymMap[token] ?? []).forEach((syn) => expanded.add(syn));
  });
  return Array.from(expanded);
};

const indexed = hscodes.map((item) => {
  const tokens = tokenize(`${item.name_en} ${item.name_vi}`);
  const counts = new Map<string, number>();
  tokens.forEach((token) => {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  });
  return { item, counts };
});

const idf = (() => {
  const df = new Map<string, number>();
  indexed.forEach(({ counts }) => {
    counts.forEach((_count, token) => {
      df.set(token, (df.get(token) ?? 0) + 1);
    });
  });
  const total = indexed.length;
  const map = new Map<string, number>();
  df.forEach((count, token) => {
    map.set(token, Math.log((total + 1) / (count + 1)) + 1);
  });
  return map;
})();

const chapterIndex = (() => {
  const map = new Map<string, Set<string>>();
  indexed.forEach(({ item, counts }) => {
    const chapter = item.hs_code.slice(0, 2);
    if (!/^\d{2}$/.test(chapter)) return;
    if (!map.has(chapter)) map.set(chapter, new Set());
    const set = map.get(chapter)!;
    counts.forEach((_value, token) => {
      set.add(token);
    });
  });
  return map;
})();

const headingIndex = (() => {
  const map = new Map<string, Set<string>>();
  indexed.forEach(({ item, counts }) => {
    const heading = item.hs_code.slice(0, 4);
    if (!/^\d{4}$/.test(heading)) return;
    if (!map.has(heading)) map.set(heading, new Set());
    const set = map.get(heading)!;
    counts.forEach((_value, token) => {
      set.add(token);
    });
  });
  return map;
})();

const scoreByTokens = (query: string) => {
  const tokens = expandTokens(tokenize(query));
  if (tokens.length === 0) return [];
  const scored: Array<{ item: HscodeItem; score: number }> = [];
  indexed.forEach(({ item, counts }) => {
    let score = 0;
    tokens.forEach((token) => {
      const tf = counts.get(token);
      if (!tf) return;
      const weight = idf.get(token) ?? 1;
      score += weight * (1 + Math.log(tf));
    });
    if (score > 0) scored.push({ item, score });
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.item);
};

const getTopChapters = (query: string, limit = 3) => {
  const tokens = expandTokens(tokenize(query));
  if (tokens.length === 0) return [];
  const scored: Array<{ chapter: string; score: number }> = [];
  chapterIndex.forEach((tokenSet, chapter) => {
    let score = 0;
    tokens.forEach((token) => {
      if (!tokenSet.has(token)) return;
      score += idf.get(token) ?? 1;
    });
    if (score > 0) scored.push({ chapter, score });
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.chapter);
};

const getTopHeadings = (query: string, chapters: string[], limit = 4) => {
  const tokens = expandTokens(tokenize(query));
  if (tokens.length === 0 || chapters.length === 0) return [];
  const scored: Array<{ heading: string; score: number }> = [];
  headingIndex.forEach((tokenSet, heading) => {
    if (!chapters.includes(heading.slice(0, 2))) return;
    let score = 0;
    tokens.forEach((token) => {
      if (!tokenSet.has(token)) return;
      score += idf.get(token) ?? 1;
    });
    if (score > 0) scored.push({ heading, score });
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.heading);
};

const rules = [
  {
    pattern:
      /(fire\s*fighting|fire\s*fighting\s*truck|fire\s*truck|fire\s*engine|firefighting)/i,
    prefer: ["40119010"]
  },
  {
    pattern: /(inflatable|air\s*filled|air-filled)/i,
    prefer: ["40169500"]
  },
  {
    pattern: /(passenger\s*car|motor\s*car|sedan|station\s*wagon)/i,
    prefer: ["40111000"]
  },
  {
    pattern: /(bus|truck|lorry|coach)/i,
    prefer: ["40112011", "40112012", "40112013"]
  },
  {
    pattern: /(motorcycle|motor\s*bike|scooter|moped)/i,
    prefer: ["40114000"]
  },
  {
    pattern: /(aircraft|airplane|aeroplane)/i,
    prefer: ["40113000"]
  }
];

const isTireQuery = (query: string) => /(tire|tyre|lop)/i.test(query);

const hasNegation = (query: string) =>
  /(not|no)\s+(\w+\s+){0,2}(inflatable|wearable|costume|suit|mascot)/i.test(
    query
  );

const getRulePreferred = (query: string) => {
  if (hasNegation(query)) return [];
  for (const rule of rules) {
    if (rule.pattern.test(query)) return rule.prefer;
  }
  return [];
};

const categoryRules: Array<{ pattern: RegExp; prefixes: string[] }> = [
  {
    pattern: /(costume|mascot|suit|wear|apparel|garment|uniform)/i,
    prefixes: ["61", "62", "65", "4016"]
  },
  { pattern: /(fish|aquarium|ornamental fish|live fish)/i, prefixes: ["03"] },
  { pattern: /(rubber|vulcanized|vulcanised|latex)/i, prefixes: ["40"] },
  { pattern: /(plastic|polymer)/i, prefixes: ["39"] },
  { pattern: /(steel|iron|metal)/i, prefixes: ["72", "73"] },
  { pattern: /(electronics|electric|battery|charger|adapter)/i, prefixes: ["85"] }
];

const getCategoryPrefixes = (query: string) => {
  const prefixes = new Set<string>();
  categoryRules.forEach((rule) => {
    if (rule.pattern.test(query)) {
      rule.prefixes.forEach((prefix) => prefixes.add(prefix));
    }
  });
  return Array.from(prefixes);
};

const materialRules: Array<{ pattern: RegExp; prefixes: string[] }> = [
  { pattern: /(rubber|vulcanized|vulcanised|latex)/i, prefixes: ["40"] },
  { pattern: /(plastic|polymer)/i, prefixes: ["39"] },
  { pattern: /(cotton|wool|textile|fabric|garment|apparel|leather)/i, prefixes: ["41", "42", "50", "51", "52", "61", "62"] },
  { pattern: /(wood|timber)/i, prefixes: ["44"] },
  { pattern: /(paper|cardboard)/i, prefixes: ["48"] },
  { pattern: /(glass)/i, prefixes: ["70"] },
  { pattern: /(ceramic|porcelain)/i, prefixes: ["69"] },
  { pattern: /(steel|iron|metal)/i, prefixes: ["72", "73"] },
  { pattern: /(aluminum|aluminium)/i, prefixes: ["76"] },
  { pattern: /(copper)/i, prefixes: ["74"] },
  { pattern: /(animal|live animal|livestock)/i, prefixes: ["01"] },
  { pattern: /(meat|edible)/i, prefixes: ["02"] },
  { pattern: /(fish|seafood)/i, prefixes: ["03"] },
  { pattern: /(dairy|milk)/i, prefixes: ["04"] },
  { pattern: /(vegetable|fruit|grain|cereal)/i, prefixes: ["07", "08", "10"] },
  { pattern: /(oil|fat)/i, prefixes: ["15"] },
  { pattern: /(chemical|compound|acid|alkali)/i, prefixes: ["28", "29", "38"] },
  { pattern: /(pharma|medicine|medical)/i, prefixes: ["30"] },
  { pattern: /(machinery|machine|engine|motor)/i, prefixes: ["84"] },
  { pattern: /(vehicle|car|truck|bike|motorcycle)/i, prefixes: ["87"] },
  { pattern: /(electronics|electric|battery|charger|adapter)/i, prefixes: ["85"] }
];

const getMaterialPrefixes = (query: string) => {
  const prefixes = new Set<string>();
  materialRules.forEach((rule) => {
    if (rule.pattern.test(query)) {
      rule.prefixes.forEach((prefix) => prefixes.add(prefix));
    }
  });
  return Array.from(prefixes);
};

const buildCandidates = (query: string) => {
  const fuse = new Fuse(hscodes, {
    keys: ["hs_code", "name_en", "name_vi"],
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: false
  });

  const variants = new Set([query]);
  if (query.includes("tire")) variants.add(query.replace(/tire/g, "tyre"));
  if (query.includes("tyre")) variants.add(query.replace(/tyre/g, "tire"));
  if (query.includes("passenger car")) {
    variants.add(query.replace(/passenger car/g, "motor car"));
  }

  const merged = new Map<string, HscodeItem>();

  const categoryPrefixes = getCategoryPrefixes(query);
  if (categoryPrefixes.length > 0) {
    hscodes
      .filter((item) =>
        categoryPrefixes.some((prefix) => item.hs_code.startsWith(prefix))
      )
      .slice(0, 80)
      .forEach((item) => merged.set(item.hs_code, item));
  }

  const topChapters = getTopChapters(query, 3);
  if (topChapters.length > 0 && categoryPrefixes.length === 0) {
    hscodes
      .filter((item) => topChapters.includes(item.hs_code.slice(0, 2)))
      .slice(0, 120)
      .forEach((item) => merged.set(item.hs_code, item));
  }

  const topHeadings = getTopHeadings(query, topChapters, 4);
  if (topHeadings.length > 0) {
    hscodes
      .filter((item) => topHeadings.includes(item.hs_code.slice(0, 4)))
      .slice(0, 120)
      .forEach((item) => merged.set(item.hs_code, item));
  }

  if (isTireQuery(query)) {
    hscodes
      .filter(
        (item) =>
          item.hs_code.startsWith("4011") ||
          item.hs_code.startsWith("4012") ||
          item.name_en.toLowerCase().includes("tyre") ||
          item.name_en.toLowerCase().includes("tire")
      )
      .slice(0, 60)
      .forEach((item) => merged.set(item.hs_code, item));
  }
  variants.forEach((term) => {
    fuse.search(term).slice(0, 40).forEach((hit) => {
      merged.set(hit.item.hs_code, hit.item);
    });
  });

  if (merged.size === 0 && (query.includes("tire") || query.includes("tyre"))) {
    hscodes
      .filter(
        (item) =>
          item.name_en.toLowerCase().includes("tyre") ||
          item.name_en.toLowerCase().includes("tire")
      )
      .slice(0, 40)
      .forEach((item) => merged.set(item.hs_code, item));
  }

  return Array.from(merged.values()).slice(0, 60);
};

const applyGriOrdering = (query: string, candidates: HscodeItem[]) => {
  if (candidates.length === 0) return [];
  const tokens = expandTokens(tokenize(query));
  const headings = getTopHeadings(query, getTopChapters(query, 3), 6);
  const chapters = getTopChapters(query, 3);

  const scored = candidates.map((item) => {
    let score = 0;
    const text = `${item.name_en} ${item.name_vi}`.toLowerCase();
    tokens.forEach((token) => {
      if (text.includes(token)) score += 1;
    });
    if (chapters.includes(item.hs_code.slice(0, 2))) score += 2;
    if (headings.includes(item.hs_code.slice(0, 4))) score += 3;
    score += Math.min(item.hs_code.length, 8) * 0.1;
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.item);
};


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
              "Include type, material, and use. Mention if it is a costume, inflatable, or wearable."
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

const expandQueryWithGroq = async (query: string) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return [];
  const groq = new Groq({ apiKey });
  const prompt =
    "Extract 6-8 short keywords that describe the product type, material, and use. " +
    "Return only a JSON array of strings. Query: " +
    query;
  const completion = await groq.chat.completions.create({
    model: groqTextModel,
    messages: [
      {
        role: "system",
        content: "Return only valid JSON array. No extra text."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 120
  });
  const raw = completion.choices[0]?.message?.content ?? "[]";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter(Boolean).slice(0, 8);
    }
  } catch {
    return [];
  }
  return [];
};

const classifyWithGroq = async (query: string) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const groq = new Groq({ apiKey });
  const prompt =
    "You are classifying a product for HS code lookup. " +
    "Return ONLY JSON with fields: " +
    '{"keywords":["..."],"hs_headings":["8510","8471"]}. ' +
    "hs_headings must be 4-digit HS headings. " +
    "Focus on the main product type, not accessories. " +
    "Query: " +
    query;

  const completion = await groq.chat.completions.create({
    model: groqTextModel,
    messages: [
      { role: "system", content: "Return only valid JSON. No extra text." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 200
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as {
      keywords?: string[];
      hs_headings?: string[];
    };
    const headings =
      parsed.hs_headings
        ?.map((h) => h.trim())
        .filter((h) => /^\d{4}$/.test(h)) ?? [];
    const keywords =
      parsed.keywords?.map((k) => k.trim()).filter(Boolean) ?? [];
    return { keywords, headings };
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { suggestions: [] },
      { status: 503, statusText: "Missing GROQ_API_KEY" }
    );
  }

  const body = (await request.json()) as {
    description?: string;
    imageDataUrl?: string;
  };

  const description = body.description?.trim() ?? "";
  const imageDataUrl = body.imageDataUrl?.trim();

  if (!description && !imageDataUrl) {
    return NextResponse.json({ suggestions: [] }, { status: 400 });
  }

  let imageHint = "";
  if (imageDataUrl) {
    if (!groqVisionModel) {
      return NextResponse.json(
        { suggestions: [], error: "Missing GROQ_VISION_MODEL" },
        { status: 503 }
      );
    }
    try {
      imageHint = await describeImage(imageDataUrl, groqVisionModel);
    } catch (error) {
      return NextResponse.json(
        { suggestions: [], error: "Vision model error" },
        { status: 502 }
      );
    }
  }

  const cleanedInput = stripTokens(
    [description, imageHint].filter(Boolean).join(" "),
    PACKAGING_TOKENS
  );
  const query = normalize(cleanedInput);
  if (!query) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  const useGroq = process.env.GROQ_ENABLE_SUGGEST === "true";
  const extraKeywords =
    useGroq && imageHint
      ? await expandQueryWithGroq(`${description} ${imageHint}`)
      : [];
  let expandedQuery = normalize([query, ...extraKeywords].join(" "));
  const reducedQuery = stripTokens(expandedQuery, INCOMPLETE_TOKENS);

  let groqHeadings: string[] = [];
  if (useGroq) {
    const classified = await classifyWithGroq(`${description} ${imageHint}`.trim());
    if (classified) {
      groqHeadings = classified.headings;
      if (classified.keywords.length > 0) {
        expandedQuery = normalize(
          [expandedQuery, ...classified.keywords].join(" ")
        );
      }
    }
  }

  const rulePreferred = getRulePreferred(reducedQuery);
  const tokenCandidates = scoreByTokens(reducedQuery);
  const fuseCandidates = buildCandidates(reducedQuery);

  const ordered: HscodeItem[] = [];
  const seen = new Set<string>();

  rulePreferred.forEach((code) => {
    const item = hscodes.find((entry) => entry.hs_code === code);
    if (item && !seen.has(item.hs_code)) {
      ordered.push(item);
      seen.add(item.hs_code);
    }
  });

  tokenCandidates.forEach((item) => {
    if (!seen.has(item.hs_code)) {
      ordered.push(item);
      seen.add(item.hs_code);
    }
  });

  fuseCandidates.forEach((item) => {
    if (!seen.has(item.hs_code)) {
      ordered.push(item);
      seen.add(item.hs_code);
    }
  });

  let candidates = ordered.slice(0, 60);
  const fishOnly = /(fish|aquarium|ornamental fish|live fish)/i.test(
    expandedQuery
  );
  if (fishOnly) {
    const onlyFish = candidates.filter((item) => item.hs_code.startsWith("03"));
    if (onlyFish.length > 0) {
      candidates = onlyFish;
    }
  }

  if (isTireQuery(reducedQuery)) {
    const allowWheelMatches = /(castor|caster|wheelbarrow|trolley)/i.test(
      expandedQuery
    );
    const tireOnly = candidates.filter((item) => {
      if (allowWheelMatches) {
        return (
          item.hs_code.startsWith("4011") ||
          item.hs_code.startsWith("4012") ||
          item.name_en.toLowerCase().includes("tyre") ||
          item.name_en.toLowerCase().includes("tire")
        );
      }
      return (
        item.hs_code.startsWith("4011") ||
        item.hs_code.startsWith("4012")
      );
    });
    if (tireOnly.length > 0) {
      candidates = tireOnly;
    }
  }

  if (groqHeadings.length > 0) {
    const headingOnly = candidates.filter((item) =>
      groqHeadings.includes(item.hs_code.slice(0, 4))
    );
    if (headingOnly.length > 0) {
      candidates = headingOnly;
    }
  }

  const materialPrefixes = getMaterialPrefixes(reducedQuery);
  if (materialPrefixes.length > 0) {
    const materialOnly = candidates.filter((item) =>
      materialPrefixes.some((prefix) => item.hs_code.startsWith(prefix))
    );
    if (materialOnly.length > 0) {
      candidates = materialOnly;
    }
  }

  candidates = applyGriOrdering(reducedQuery, candidates);
  const candidateText = candidates
    .map(
      (item) =>
        `- ${item.hs_code} | ${item.name_en} | ${item.name_vi ?? ""}`.trim()
    )
    .join("\n");

  if (rulePreferred.length > 0) {
    const preferredItems = rulePreferred
      .map((code) => hscodes.find((entry) => entry.hs_code === code))
      .filter(Boolean) as HscodeItem[];
    const preferredSuggestions = preferredItems.slice(0, 5).map((item) => ({
      hs_code: item.hs_code,
      name_en: item.name_en,
      name_vi: item.name_vi,
      reason: "Matched by rule"
    }));
    if (preferredSuggestions.length === 0) {
      const fallbackSuggestions = candidates.slice(0, 5).map((item) => ({
        hs_code: item.hs_code,
        name_en: item.name_en,
        name_vi: item.name_vi,
        reason: "Matched by similarity"
      }));
      return NextResponse.json({
        suggestions: fallbackSuggestions,
        imageHint: imageHint || null
      });
    }
    return NextResponse.json({
      suggestions: preferredSuggestions,
      imageHint: imageHint || null
    });
  }

  if (!useGroq) {
    const fallbackSuggestions = candidates.slice(0, 5).map((item) => ({
      hs_code: item.hs_code,
      name_en: item.name_en,
      name_vi: item.name_vi,
      reason: "Matched by similarity"
    }));
    return NextResponse.json({
      suggestions: fallbackSuggestions,
      imageHint: imageHint || null
    });
  }

  const groq = new Groq({ apiKey });
  const prompt =
    "You are a Vietnam HS code assistant. " +
    "Pick the best matching HS codes ONLY from the candidate list. " +
    "Return ONLY JSON with up to 5 suggestions: " +
    '{"suggestions":[{"hs_code":"...","name_en":"...","name_vi":"...","reason":"..."}]}. ' +
    "Keep reasons under 18 words. " +
    "Candidate list:\n" +
    candidateText +
    "\nUser input:\n" +
    [description, imageHint].filter(Boolean).join(" ");

  const completion = await groq.chat.completions.create({
    model: groqTextModel,
    messages: [
      {
        role: "system",
        content:
          "Return only valid JSON. Do not include markdown or extra text."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 400
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parseJsonSafe = (value: string) => {
    try {
      return JSON.parse(value) as { suggestions?: Suggestion[] };
    } catch {
      const start = value.indexOf("{");
      const end = value.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          return JSON.parse(value.slice(start, end + 1)) as {
            suggestions?: Suggestion[];
          };
        } catch {
          return {};
        }
      }
      return {};
    }
  };

  const parsed = parseJsonSafe(raw);

  const candidateLookup = new Map(
    candidates.map((item) => [item.hs_code, item])
  );
  const safeSuggestions =
    parsed.suggestions
      ?.filter((item) => candidateLookup.has(item.hs_code))
      .slice(0, 5) ?? [];

  const fallbackSuggestions =
    safeSuggestions.length > 0
      ? []
      : candidates.slice(0, 5).map((item) => ({
          hs_code: item.hs_code,
          name_en: item.name_en,
          name_vi: item.name_vi,
          reason: "Matched by text similarity"
        }));

  return NextResponse.json({
    suggestions:
      safeSuggestions.length > 0 ? safeSuggestions : fallbackSuggestions,
    imageHint: imageHint || null
  });
}
