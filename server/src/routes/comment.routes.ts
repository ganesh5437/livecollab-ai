import { Router } from "express";
import * as commentController from "../controllers/comment.controller";
import { requireDocumentAccess } from "../middleware/requireDocumentAccess";

// Mounted at /documents/:documentId/comments — requireAuth already applied
// by the parent document router, so we only add the document-permission check here.
const router = Router({ mergeParams: true });

router.post("/", requireDocumentAccess("VIEWER"), commentController.create);
router.get("/", requireDocumentAccess("VIEWER"), commentController.list);
router.patch("/:commentId/resolve", requireDocumentAccess("EDITOR"), commentController.resolve);
router.delete("/:commentId", requireDocumentAccess("VIEWER"), commentController.remove);

export default router;
