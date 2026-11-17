import { Router } from "express";
import {
  createClothesExchange,
  listIncomingClothesExchanges,
  listFavoriteClothes,
  listMyClothes,
  listTradingClothes,
  registerClothes,
  respondToExchange,
  updateClothesAvailability,
  updateClothesFavorite,
} from "../controller/clothesController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/trading", authMiddleware, listTradingClothes);
router.get("/mine", authMiddleware, listMyClothes);
router.get("/favorites", authMiddleware, listFavoriteClothes);
router.get("/exchanges", authMiddleware, listIncomingClothesExchanges);
router.put("/exchanges/:id", authMiddleware, respondToExchange);
router.put("/:id/availability", authMiddleware, updateClothesAvailability);
router.put("/:id/favorite", authMiddleware, updateClothesFavorite);
router.post("/:id/exchanges", authMiddleware, createClothesExchange);
router.post("/", authMiddleware, registerClothes);

export default router;