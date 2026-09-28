import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

export async function createFolder(ownerId: string, name: string, parentId?: string) {
  return prisma.folder.create({ data: { name, ownerId, parentId } });
}

export async function listMyFolders(ownerId: string) {
  return prisma.folder.findMany({ where: { ownerId }, orderBy: { name: "asc" } });
}

export async function renameFolder(folderId: string, ownerId: string, name: string) {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder || folder.ownerId !== ownerId) throw new AppError("Folder not found", 404);
  return prisma.folder.update({ where: { id: folderId }, data: { name } });
}

export async function deleteFolder(folderId: string, ownerId: string) {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder || folder.ownerId !== ownerId) throw new AppError("Folder not found", 404);
  await prisma.folder.delete({ where: { id: folderId } });
}
