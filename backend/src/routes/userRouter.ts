import { Router } from "express";
import { registerUser, login } from "../controller/userController";

const router = Router();

router.post("/register", registerUser);
router.post("/login", login);

export default router;