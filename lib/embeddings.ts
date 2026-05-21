import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const EMBED_DIM = Number(process.env.GEMINI_EMBED_DIM || 768);

const genAI = new GoogleGenerativeAI(apiKey);

type CacheEntry = {
  hash: string;
  vector: number[];
};

const embedCache = new Map<string, CacheEntry>();

function normalize(v: number[]): number[] {
  let s = 0;
  for (let i = 0; i < v.length; i++) s += v[i] * v[i];
  if (s === 0) return v;
  const inv = 1 / Math.sqrt(s);
  const out = new Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] * inv;
  return out;
}

function hashText(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return `${text.length}:${h}`;
}

export async function embedText(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_QUERY",
): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBED_MODEL });
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    taskType: taskType as any,
    outputDimensionality: EMBED_DIM,
  } as any);
  return normalize(result.embedding.values);
}

export async function getOrEmbed(key: string, text: string): Promise<number[]> {
  const hash = hashText(text);
  const cached = embedCache.get(key);
  if (cached && cached.hash === hash) return cached.vector;
  const vector = await embedText(text);
  embedCache.set(key, { hash, vector });
  return vector;
}

export async function batchEmbed(
  items: { key: string; text: string }[],
): Promise<Map<string, number[]>> {
  const out = new Map<string, number[]>();
  const toFetch: { key: string; text: string; hash: string }[] = [];
  for (const it of items) {
    const hash = hashText(it.text);
    const cached = embedCache.get(it.key);
    if (cached && cached.hash === hash) {
      out.set(it.key, cached.vector);
    } else {
      toFetch.push({ ...it, hash });
    }
  }
  if (toFetch.length === 0) return out;

  const model = genAI.getGenerativeModel({ model: EMBED_MODEL });
  const CHUNK = 90;
  for (let i = 0; i < toFetch.length; i += CHUNK) {
    const chunk = toFetch.slice(i, i + CHUNK);
    const res = await model.batchEmbedContents({
      requests: chunk.map((c) => ({
        content: { role: "user", parts: [{ text: c.text }] },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: EMBED_DIM,
      })) as any,
    });
    res.embeddings.forEach((e, idx) => {
      const item = chunk[idx];
      const v = normalize(e.values);
      embedCache.set(item.key, { hash: item.hash, vector: v });
      out.set(item.key, v);
    });
  }
  return out;
}

export function cosineSimilarity(a: number[], b: number[]): number {
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
