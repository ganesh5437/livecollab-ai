import { Response, NextFunction } from "express";
import { createDocumentSchema } from "../utils/validation";
import * as documentService from "../services/document.service";
import { AuthedRequest } from "../middleware/requireAuth";

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { title, folderId } = createDocumentSchema.parse(req.body);
    const doc = await documentService.createDocument(req.user!.userId, title, folderId);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

export async function get(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const doc = await documentService.getDocument(req.params.id);
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const docs = await documentService.listMyDocuments(req.user!.userId);
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

export async function rename(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { title } = createDocumentSchema.pick({ title: true }).parse(req.body);
    const doc = await documentService.renameDocument(req.params.id, title);
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    await documentService.deleteDocument(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
