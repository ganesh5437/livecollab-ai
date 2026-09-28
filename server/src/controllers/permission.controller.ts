import { Response, NextFunction } from "express";
import * as permissionService from "../services/permission.service";
import { z } from "zod";

const shareSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]),
});

export async function share(req: any, res: Response, next: NextFunction) {
  try {
    const { email, role } = shareSchema.parse(req.body);
    const permission = await permissionService.shareDocument(req.params.documentId, email, role);
    res.status(201).json(permission);
  } catch (err) {
    next(err);
  }
}

export async function list(req: any, res: Response, next: NextFunction) {
  try {
    const permissions = await permissionService.listPermissions(req.params.documentId);
    res.json(permissions);
  } catch (err) {
    next(err);
  }
}

export async function revoke(req: any, res: Response, next: NextFunction) {
  try {
    await permissionService.revokePermission(req.params.documentId, req.params.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
