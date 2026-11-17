import { Router } from "express";
import { listConversationMessages, listConversations } from "../controller/messageController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/conversations", authMiddleware, listConversations);
router.get("/:id", authMiddleware, listConversationMessages);

export default router;
