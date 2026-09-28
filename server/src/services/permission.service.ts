import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

export async function shareDocument(documentId: string, granteeEmail: string, role: "OWNER" | "EDITOR" | "VIEWER") {
  const grantee = await prisma.user.findUnique({ where: { email: granteeEmail } });
  if (!grantee) throw new AppError("No user found with that email", 404);

  const permission = await prisma.permission.upsert({
    where: { documentId_userId: { documentId, userId: grantee.id } },
    update: { role },
    create: { documentId, userId: grantee.id, role },
  });

  await prisma.notification.create({
    data: {
      userId: grantee.id,
      type: "DOCUMENT_SHARED",
      documentId,
      message: `A document was shared with you (${role.toLowerCase()} access)`,
    },
  });

  return permission;
}

export async function listPermissions(documentId: string) {
  return prisma.permission.findMany({
    where: { documentId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
}

export async function revokePermission(documentId: string, userId: string) {
  await prisma.permission.delete({ where: { documentId_userId: { documentId, userId } } });
}
