import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import Groq from "groq-sdk";

const getSuggestions = unstable_cache(
  async (query: string) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return [];
    const model = process.env.GROQ_MODEL || "llama3-8b-8192";
    const groq = new Groq({ apiKey });
    const prompt =
      "You are helping an HS code lookup search. " +
      "Return a concise comma-separated list of up to 5 related keywords or phrases " +
      "that could improve the search. Include EN and VI when possible. " +
      "Return only the list, no extra text. Query: " +
      query;

    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 120
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
  },
  ["groq-search-assist"],
  { revalidate: 60 * 60 * 24 }
);

export async function POST(request: Request) {
  const body = (await request.json()) as { query?: string };
  const query = body.query?.trim();
  if (!query) return NextResponse.json({ suggestions: [] }, { status: 400 });

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ suggestions: [] }, { status: 503 });
  }

  const suggestions = await getSuggestions(query);
  return NextResponse.json({ suggestions });
}
