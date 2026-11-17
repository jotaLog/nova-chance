import { Router } from "express";

import {
  addPostComment,
  listPostComments,
  listPosts,
  listSavedPosts,
  listUserPosts,
  publishPost,
  updatePostLike,
  updatePostSaved,
} from "../controller/postController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, listPosts);
router.get("/saved", authMiddleware, listSavedPosts);
router.get("/user/:id", authMiddleware, listUserPosts);
router.post("/", authMiddleware, publishPost);
router.get("/:id/comments", authMiddleware, listPostComments);
router.post("/:id/comments", authMiddleware, addPostComment);
router.put("/:id/like", authMiddleware, updatePostLike);
router.put("/:id/save", authMiddleware, updatePostSaved);

export default router;
