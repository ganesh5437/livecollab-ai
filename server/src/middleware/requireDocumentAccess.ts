import { Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { AuthedRequest } from "./requireAuth";

export type DocRole = "OWNER" | "EDITOR" | "VIEWER";

const ROLE_RANK: Record<DocRole, number> = { VIEWER: 0, EDITOR: 1, OWNER: 2 };

export interface DocAuthedRequest extends AuthedRequest {
  documentRole?: DocRole;
}

export function requireDocumentAccess(minRole: DocRole = "VIEWER") {
  return async (req: DocAuthedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const documentId = req.params.documentId ?? req.params.id;

    if (!userId) return res.status(401).json({ error: "Unauthenticated" });
    if (!documentId) return res.status(400).json({ error: "Missing documentId" });

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    let role: DocRole | undefined;
    if (doc.ownerId === userId) {
      role = "OWNER";
    } else {
      const perm = await prisma.permission.findUnique({
        where: { documentId_userId: { documentId, userId } },
      });
      role = perm?.role as DocRole | undefined;
    }

    if (!role || ROLE_RANK[role] < ROLE_RANK[minRole]) {
      return res.status(403).json({ error: "Insufficient document permission" });
    }

    req.documentRole = role;
    next();
  };
}

export function requireRole(...roles: DocRole[]) {
  return (req: DocAuthedRequest, res: Response, next: NextFunction) => {
    if (!req.documentRole || !roles.includes(req.documentRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
