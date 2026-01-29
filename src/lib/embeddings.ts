import fs from "fs";
import path from "path";

type EmbeddingEntry = {
  hs_code: string;
  slug: string;
  embedding: number[];
};

const embeddingsPath = path.join(
  process.cwd(),
  "src",
  "data",
  "hscode-embeddings.json"
);

let cache: EmbeddingEntry[] | null = null;

export const hasEmbeddings = () => fs.existsSync(embeddingsPath);

export const getEmbeddings = () => {
  if (!hasEmbeddings()) return [];
  if (cache) return cache;
  const raw = fs.readFileSync(embeddingsPath, "utf-8");
  cache = JSON.parse(raw) as EmbeddingEntry[];
  return cache;
};
