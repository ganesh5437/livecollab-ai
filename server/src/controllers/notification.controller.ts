import { Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service";

export async function list(req: any, res: Response, next: NextFunction) {
  try {
    const [notifications, unread] = await Promise.all([
      notificationService.listNotifications(req.user.userId),
      notificationService.unreadCount(req.user.userId),
    ]);
    res.json({ notifications, unread });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: any, res: Response, next: NextFunction) {
  try {
    await notificationService.markRead(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: any, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllRead(req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
