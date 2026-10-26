import fs from "fs";
import path from "path";
import { createEmbeddings } from "./openai";

export type KnowledgeChunk = {
  id: string;
  title: string;
  source: string;
  text: string;
  embedding: number[];
};

type IndexedStore = {
  chunks: KnowledgeChunk[];
  ready: boolean;
};

const store: IndexedStore = { chunks: [], ready: false };
let indexingPromise: Promise<void> | null = null;

const MIN_SCORE = 0.35;
const TOP_K = 4;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function splitMarkdown(fileName: string, content: string) {
  const source = fileName.replace(/\.md$/, "");
  const sections = content.split(/\n(?=## )/);
  const chunks: Omit<KnowledgeChunk, "embedding">[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;

    const lines = section.split("\n");
    const headingLine = lines[0].replace(/^#+\s*/, "").trim();
    const body = lines.slice(1).join("\n").trim();
    const text = body ? `${headingLine}\n\n${body}` : headingLine;
    if (text.length < 40) continue;

    chunks.push({
      id: `${source}-${i}`,
      title: headingLine,
      source,
      text,
    });
  }

  return chunks;
}

async function buildIndex() {
  const knowledgeDir = path.join(process.cwd(), "knowledge");
  const files = fs
    .readdirSync(knowledgeDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const rawChunks: Omit<KnowledgeChunk, "embedding">[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(knowledgeDir, file), "utf8");
    rawChunks.push(...splitMarkdown(file, content));
  }

  if (rawChunks.length === 0) {
    store.chunks = [];
    store.ready = true;
    return;
  }

  const embeddings = await createEmbeddings(rawChunks.map((c) => c.text));
  store.chunks = rawChunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));
  store.ready = true;
}

export async function ensureIndex() {
  if (store.ready) return;
  if (!indexingPromise) {
    indexingPromise = buildIndex().catch((err) => {
      indexingPromise = null;
      throw err;
    });
  }
  await indexingPromise;
}

export async function retrieve(query: string) {
  await ensureIndex();

  const [queryEmbedding] = await createEmbeddings([query]);
  const scored = store.chunks
    .map((chunk) => ({
      title: chunk.title,
      text: chunk.text,
      source: chunk.source,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score >= MIN_SCORE).slice(0, TOP_K);
  if (top.length > 0) return top;

  return scored.slice(0, 2).map((s) => ({ ...s, score: Math.min(s.score, 0.34) }));
}
