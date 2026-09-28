import { Router } from "express";
import * as folderController from "../controllers/folder.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.post("/", folderController.create);
router.get("/", folderController.list);
router.patch("/:id", folderController.rename);
router.delete("/:id", folderController.remove);

export default router;
