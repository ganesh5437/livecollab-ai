import { Response, NextFunction } from "express";
import { folderSchema } from "../utils/validation";
import * as folderService from "../services/folder.service";
import { AuthedRequest } from "../middleware/requireAuth";

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { name, parentId } = folderSchema.parse(req.body);
    const folder = await folderService.createFolder(req.user!.userId, name, parentId);
    res.status(201).json(folder);
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const folders = await folderService.listMyFolders(req.user!.userId);
    res.json(folders);
  } catch (err) {
    next(err);
  }
}

export async function rename(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { name } = folderSchema.pick({ name: true }).parse(req.body);
    const folder = await folderService.renameFolder(req.params.id, req.user!.userId, name);
    res.json(folder);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    await folderService.deleteFolder(req.params.id, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
