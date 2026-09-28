import { Response, NextFunction } from "express";
import { createCommentSchema } from "../utils/validation";
import * as commentService from "../services/comment.service";

export async function create(req: any, res: Response, next: NextFunction) {
  try {
    const { content, fromPosition, toPosition, parentCommentId } = createCommentSchema.parse(req.body);
    const comment = await commentService.createComment(
      req.params.documentId,
      req.user.userId,
      content,
      fromPosition,
      toPosition,
      parentCommentId
    );
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

export async function list(req: any, res: Response, next: NextFunction) {
  try {
    const comments = await commentService.listComments(req.params.documentId);
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

export async function resolve(req: any, res: Response, next: NextFunction) {
  try {
    const comment = await commentService.resolveComment(req.params.commentId, req.body.resolved !== false);
    res.json(comment);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: any, res: Response, next: NextFunction) {
  try {
    await commentService.deleteComment(req.params.commentId, req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
