import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import Groq from "groq-sdk";

const getExplanation = unstable_cache(
  async (hs_code: string, name_en: string) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return "";
    const model = process.env.GROQ_MODEL || "llama3-8b-8192";
    const groq = new Groq({ apiKey });
    const prompt = `Explain what the commodity '${name_en}' (HS Code ${hs_code}) is in simple terms and give 1 tip for importing it. Keep it under 50 words.`;
    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 120
    });

    return completion.choices[0]?.message?.content?.trim() ?? "";
  },
  ["groq-explain"],
  { revalidate: 60 * 60 * 24 }
);

export async function POST(request: Request) {
  const body = (await request.json()) as {
    hs_code?: string;
    name_en?: string;
  };

  if (!body.hs_code || !body.name_en) {
    return NextResponse.json({ text: null }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { text: null },
      { status: 503, statusText: "Missing GROQ_API_KEY" }
    );
  }

  const text = await getExplanation(body.hs_code, body.name_en);
  return NextResponse.json({ text });
}
