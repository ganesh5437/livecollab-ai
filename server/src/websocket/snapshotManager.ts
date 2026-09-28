import * as Y from "yjs";
import { prisma } from "../config/prisma";

const DEBOUNCE_MS = 7000;
const timers = new Map<string, NodeJS.Timeout>();
const listenersAttached = new Set<string>();

export function scheduleSnapshot(documentId: string, ydoc: Y.Doc, lastEditorId: string) {
  if (!listenersAttached.has(documentId)) {
    listenersAttached.add(documentId);

    ydoc.on("update", () => {
      const existing = timers.get(documentId);
      if (existing) clearTimeout(existing);

      timers.set(
        documentId,
        setTimeout(() => saveSnapshot(documentId, ydoc, lastEditorId), DEBOUNCE_MS)
      );
    });
  }
}

async function saveSnapshot(documentId: string, ydoc: Y.Doc, editorId: string) {
  try {
    const snapshot = Buffer.from(Y.encodeStateAsUpdate(ydoc));

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return;

    const nextRevision = doc.currentRevision + 1;

    await prisma.$transaction([
      prisma.documentVersion.create({
        data: {
          documentId,
          versionNumber: nextRevision,
          snapshot,
          createdById: editorId,
          description: "Autosave",
        },
      }),
      prisma.document.update({
        where: { id: documentId },
        data: { currentRevision: nextRevision },
      }),
    ]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Snapshot save failed for document ${documentId}:`, err);
  }
}
