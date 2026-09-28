import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

export async function createDocument(ownerId: string, title: string, folderId?: string) {
  const doc = await prisma.document.create({
    data: { title, ownerId },
  });

  if (folderId) {
    await prisma.documentFolder.create({ data: { documentId: doc.id, folderId } });
  }

  return doc;
}

export async function getDocument(documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new AppError("Document not found", 404);
  return doc;
}

export async function listMyDocuments(userId: string) {
  return prisma.document.findMany({
    where: {
      OR: [{ ownerId: userId }, { permissions: { some: { userId } } }],
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function renameDocument(documentId: string, title: string) {
  return prisma.document.update({ where: { id: documentId }, data: { title } });
}

export async function deleteDocument(documentId: string) {
  await prisma.document.delete({ where: { id: documentId } });
}
