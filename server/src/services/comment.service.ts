import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";

export async function createComment(
  documentId: string,
  authorId: string,
  content: string,
  fromPosition: number,
  toPosition: number,
  parentCommentId?: string
) {
  const comment = await prisma.comment.create({
    data: { documentId, authorId, content, fromPosition, toPosition, parentCommentId },
    include: { author: { select: { id: true, name: true } } },
  });

  await notifyOnComment(documentId, authorId, parentCommentId);

  return comment;
}

async function notifyOnComment(documentId: string, authorId: string, parentCommentId?: string) {
  const doc = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  const recipients = new Set<string>();

  if (parentCommentId) {
    // Reply — notify the parent comment's author specifically.
    const parent = await prisma.comment.findUnique({ where: { id: parentCommentId } });
    if (parent && parent.authorId !== authorId) recipients.add(parent.authorId);
  } else {
    // New top-level comment — notify the document owner and everyone with access.
    if (doc.ownerId !== authorId) recipients.add(doc.ownerId);
    const perms = await prisma.permission.findMany({ where: { documentId } });
    for (const p of perms) if (p.userId !== authorId) recipients.add(p.userId);
  }

  if (recipients.size === 0) return;

  await prisma.notification.createMany({
    data: Array.from(recipients).map((userId) => ({
      userId,
      type: parentCommentId ? ("COMMENT_REPLY" as const) : ("COMMENT_ADDED" as const),
      documentId,
      message: parentCommentId ? "Someone replied to your comment" : "New comment on a document",
    })),
  });
}

export async function listComments(documentId: string) {
  return prisma.comment.findMany({
    where: { documentId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function resolveComment(commentId: string, resolved: boolean) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError("Comment not found", 404);
  return prisma.comment.update({ where: { id: commentId }, data: { resolved } });
}

export async function deleteComment(commentId: string, requesterId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError("Comment not found", 404);
  if (comment.authorId !== requesterId) throw new AppError("Only the author can delete this comment", 403);
  await prisma.comment.delete({ where: { id: commentId } });
}
