import { Router } from "express";
import { registerClothes } from "../controller/clothesController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, registerClothes);

export default router;