import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";
import type { HscodeItem } from "@/lib/hscode";
import data from "@/data/hscode.json";

type EmbeddingRow = {
  slug: string;
  vector: number[];
};

const outputPath = path.join(
  process.cwd(),
  "src",
  "data",
  "hscode-embeddings.json"
);

const modelName =
  process.env.LOCAL_EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";

const buildText = (item: HscodeItem) =>
  `${item.hs_code} ${item.name_en} ${item.name_vi}`.trim();

const main = async () => {
  const items = data as HscodeItem[];
  if (!items.length) {
    console.error("No HS code data found. Run process-data first.");
    process.exit(1);
  }

  const embedder = await pipeline("feature-extraction", modelName);
  const rows: EmbeddingRow[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const text = buildText(item);
    const output = await embedder(text, { pooling: "mean", normalize: true });
    const vector = Array.from(output.data as Float32Array);
    rows.push({ slug: item.slug, vector });

    if ((i + 1) % 500 === 0) {
      console.log(`Embedded ${i + 1}/${items.length}`);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(rows), "utf-8");
  console.log(`Saved embeddings to ${outputPath}`);
};

main();
