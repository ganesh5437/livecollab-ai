import { docs } from "y-websocket/bin/utils";
import * as Y from "yjs";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { extractPlainText, chunkText } from "../ai/textExtract";
import { embedText, cosineSimilarity, serializeVector, deserializeVector } from "../ai/embeddings";
import { callGroq, streamGroq } from "../ai/groq";

const SUMMARIZE_MODEL = "llama-3.3-70b-versatile";
const RAG_MODEL = "llama-3.3-70b-versatile";
const AUTOCOMPLETE_MODEL = "llama-3.1-8b-instant";
const TOP_K_CHUNKS = 4;

const summaryCache = new Map<string, string>();

async function getDocumentText(documentId: string): Promise<{ text: string; revision: number }> {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new AppError("Document not found", 404);

  const liveDoc: Y.Doc | undefined = docs.get(documentId);
  if (liveDoc) {
    return { text: extractPlainText(liveDoc), revision: doc.currentRevision };
  }

  const latestVersion = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { versionNumber: "desc" },
  });
  if (!latestVersion) return { text: "", revision: doc.currentRevision };

  const tempDoc = new Y.Doc();
  Y.applyUpdate(tempDoc, latestVersion.snapshot);
  return { text: extractPlainText(tempDoc), revision: doc.currentRevision };
}

export async function ensureIndexed(documentId: string): Promise<void> {
  const doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });

  const upToDate = await prisma.embedding.findFirst({
    where: { documentId, revision: doc.currentRevision },
  });
  if (upToDate) return;

  const { text } = await getDocumentText(documentId);
  const chunks = chunkText(text);

  await prisma.$transaction([
    prisma.embedding.deleteMany({ where: { documentId } }),
    ...chunks.map((chunk, i) =>
      prisma.embedding.create({
        data: {
          documentId,
          chunkId: i,
          chunkText: chunk,
          revision: doc.currentRevision,
          embedding: serializeVector(embedText(chunk)),
        },
      })
    ),
  ]);
}

export async function summarizeDocument(documentId: string): Promise<string> {
  const { text, revision } = await getDocumentText(documentId);
  if (!text.trim()) return "This document is empty — nothing to summarize yet.";

  const cacheKey = `${documentId}:${revision}`;
  const cached = summaryCache.get(cacheKey);
  if (cached) return cached;

  const chunks = chunkText(text, 3000);
  const partials: string[] = [];

  for (const chunk of chunks) {
    const partial = await callGroq(
      SUMMARIZE_MODEL,
      "Summarize this section of a document in 2-3 concise sentences. No preamble.",
      [{ role: "user", content: chunk }],
      300
    );
    partials.push(partial);
  }

  const summary =
    partials.length === 1
      ? partials[0]
      : await callGroq(
          SUMMARIZE_MODEL,
          "Combine these section summaries into one coherent overall summary, 4-6 sentences. No preamble.",
          [{ role: "user", content: partials.join("\n\n") }],
          500
        );

  summaryCache.set(cacheKey, summary);
  return summary;
}

interface RagChunk {
  chunkId: number;
  chunkText: string;
  score: number;
}

async function retrieveTopChunks(documentId: string, question: string): Promise<RagChunk[]> {
  await ensureIndexed(documentId);

  const embeddings = await prisma.embedding.findMany({ where: { documentId } });
  if (embeddings.length === 0) return [];

  const questionVector = embedText(question);
  const scored = embeddings.map((e) => ({
    chunkId: e.chunkId,
    chunkText: e.chunkText,
    score: cosineSimilarity(questionVector, deserializeVector(e.embedding)),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, TOP_K_CHUNKS);
}

export async function* answerQuestionStream(
  documentId: string,
  question: string
): AsyncGenerator<{ type: "text"; value: string } | { type: "citations"; value: RagChunk[] }> {
  const topChunks = await retrieveTopChunks(documentId, question);

  if (topChunks.length === 0) {
    yield { type: "text", value: "This document doesn't have enough content to answer questions yet." };
    yield { type: "citations", value: [] };
    return;
  }

  const context = topChunks
    .map((c) => `[chunk ${c.chunkId}]\n${c.chunkText}`)
    .join("\n\n");

  const system =
    "Answer the question using ONLY the provided document excerpts. " +
    "Cite chunk numbers like [chunk N] inline where relevant. " +
    "If the excerpts don't contain the answer, say so plainly.";

  for await (const delta of streamGroq(
    RAG_MODEL,
    system,
    [{ role: "user", content: `Document excerpts:\n\n${context}\n\nQuestion: ${question}` }],
    800
  )) {
    yield { type: "text", value: delta };
  }

  yield { type: "citations", value: topChunks };
}

export async function autocomplete(documentId: string, context: string): Promise<string> {
  if (!context.trim()) return "";

  const completion = await callGroq(
    AUTOCOMPLETE_MODEL,
    "Continue the user's writing naturally for one short sentence or phrase. " +
      "Output ONLY the continuation text, no quotes, no explanation.",
    [{ role: "user", content: context.slice(-1500) }],
    60
  );

  return completion.trim();
}
