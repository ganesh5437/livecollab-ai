import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { docs } from "y-websocket/bin/utils";
import * as Y from "yjs";

export async function listVersions(documentId: string) {
  return prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { versionNumber: "desc" },
    select: {
      id: true,
      versionNumber: true,
      description: true,
      createdAt: true,
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function rollbackToVersion(documentId: string, versionId: string, userId: string) {
  const version = await prisma.documentVersion.findUnique({ where: { id: versionId } });
  if (!version || version.documentId !== documentId) {
    throw new AppError("Version not found", 404);
  }

  const ydoc: Y.Doc | undefined = docs.get(documentId);
  if (ydoc) {
    const fresh = new Y.Doc();
    Y.applyUpdate(fresh, version.snapshot);
    const resetUpdate = Y.encodeStateAsUpdate(fresh);
    Y.applyUpdate(ydoc, resetUpdate);
  }

  const doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  const nextRevision = doc.currentRevision + 1;

  const newVersion = await prisma.$transaction([
    prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: nextRevision,
        snapshot: version.snapshot,
        createdById: userId,
        description: `Rolled back to version ${version.versionNumber}`,
      },
    }),
    prisma.document.update({ where: { id: documentId }, data: { currentRevision: nextRevision } }),
  ]);

  return newVersion[0];
}
