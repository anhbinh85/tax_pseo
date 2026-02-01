import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

type Suggestion = {
  hs_code: string;
  name_en: string;
  name_vi: string;
  reason: string;
};

const groqTextModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const groqVisionModel = process.env.GROQ_VISION_MODEL;


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
  } catch {
      return NextResponse.json(
        { suggestions: [], error: "Vision model error" },
        { status: 502 }
      );
    }
  }

  const groq = new Groq({ apiKey });
  const prompt =
    "You are a Vietnam HS code assistant. " +
    "Given a product description, return up to 5 most likely HS codes. " +
    "Return ONLY JSON with this shape: " +
    '{"suggestions":[{"hs_code":"09011100","name_en":"...","name_vi":"...","reason":"..."}]}. ' +
    "Prefer 8-digit HS codes when possible. " +
    "Keep reasons under 18 words. " +
    "Product input:\n" +
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
  const parsed = parseJsonSafe(raw);
  const extractSuggestions = (payload: unknown): Suggestion[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload as Suggestion[];
    if (typeof payload === "object") {
      const obj = payload as { suggestions?: Suggestion[]; hs_code?: string };
      if (Array.isArray(obj.suggestions)) return obj.suggestions;
      if (obj.hs_code) return [obj as Suggestion];
    }
    return [];
  };
  let safeSuggestions = extractSuggestions(parsed).filter(
    (item) => item.hs_code && (item.name_en || item.name_vi)
  );

  if (safeSuggestions.length === 0) {
    const retry = await groq.chat.completions.create({
      model: groqTextModel,
      messages: [
        {
          role: "system",
          content:
            "Return only valid JSON array. Do not include markdown or extra text."
        },
        {
          role: "user",
          content:
            "Return a JSON array of up to 5 objects with fields: " +
            "hs_code, name_en, name_vi, reason. Input: " +
            [description, imageHint].filter(Boolean).join(" ")
        }
      ],
      temperature: 0.2,
      max_tokens: 400
    });
    const retryRaw = retry.choices[0]?.message?.content ?? "";
    const retryParsed = parseJsonSafe(retryRaw);
    safeSuggestions = extractSuggestions(retryParsed).filter(
      (item) => item.hs_code && (item.name_en || item.name_vi)
    );
  }

  return NextResponse.json({
    suggestions: safeSuggestions.slice(0, 5),
    imageHint: imageHint || null
  });
}
