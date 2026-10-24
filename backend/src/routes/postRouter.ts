import { Router } from "express";

import { publishPost } from "../controller/postController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, publishPost);

export default router;
