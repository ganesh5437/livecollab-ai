import { Response, NextFunction } from "express";
import * as versionService from "../services/version.service";

export async function list(req: any, res: Response, next: NextFunction) {
  try {
    const versions = await versionService.listVersions(req.params.documentId);
    res.json(versions);
  } catch (err) {
    next(err);
  }
}

export async function rollback(req: any, res: Response, next: NextFunction) {
  try {
    const version = await versionService.rollbackToVersion(
      req.params.documentId,
      req.params.versionId,
      req.user.userId
    );
    res.json(version);
  } catch (err) {
    next(err);
  }
}
