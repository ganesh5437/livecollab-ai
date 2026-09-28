const VECTOR_SIZE = 256;

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "to", "of",
  "and", "or", "in", "on", "for", "with", "as", "at", "by", "this", "that",
  "it", "from", "but", "not", "have", "has", "had", "will", "would", "can",
]);

export function embedText(text: string): number[] {
  const vector = new Array(VECTOR_SIZE).fill(0);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  for (const word of words) {
    const idx = hash(word) % VECTOR_SIZE;
    vector[idx] += 1;
  }

  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function serializeVector(vector: number[]): string {
  return JSON.stringify(vector);
}

export function deserializeVector(raw: string): number[] {
  return JSON.parse(raw);
}
