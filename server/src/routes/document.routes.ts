import { Router } from "express";
import * as documentController from "../controllers/document.controller";
import * as permissionController from "../controllers/permission.controller";
import * as versionController from "../controllers/version.controller";
import * as aiController from "../controllers/ai.controller";
import commentRoutes from "./comment.routes";
import { requireAuth } from "../middleware/requireAuth";
import { requireDocumentAccess } from "../middleware/requireDocumentAccess";
import { aiLimiter, autocompleteLimiter } from "../middleware/rateLimiters";

const router = Router();

router.use(requireAuth);

router.post("/", documentController.create);
router.get("/", documentController.list);
router.get("/:id", requireDocumentAccess("VIEWER"), documentController.get);
router.patch("/:id", requireDocumentAccess("EDITOR"), documentController.rename);
router.delete("/:id", requireDocumentAccess("OWNER"), documentController.remove);

router.post("/:documentId/share", requireDocumentAccess("OWNER"), permissionController.share);
router.get("/:documentId/share", requireDocumentAccess("OWNER"), permissionController.list);
router.delete("/:documentId/share/:userId", requireDocumentAccess("OWNER"), permissionController.revoke);

router.get("/:documentId/versions", requireDocumentAccess("VIEWER"), versionController.list);
router.post(
  "/:documentId/versions/:versionId/rollback",
  requireDocumentAccess("EDITOR"),
  versionController.rollback
);

router.post("/:documentId/ai/summarize", requireDocumentAccess("VIEWER"), aiLimiter, aiController.summarize);
router.post("/:documentId/ai/ask", requireDocumentAccess("VIEWER"), aiLimiter, aiController.ask);
router.post(
  "/:documentId/ai/autocomplete",
  requireDocumentAccess("EDITOR"),
  autocompleteLimiter,
  aiController.autocomplete
);

// Comments — threaded, anchored to text ranges (Phase 5).
router.use("/:documentId/comments", commentRoutes);

export default router;
