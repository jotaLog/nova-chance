import { Router } from "express";

import { registerUser, login,
    requestPasswordReset, resetPassword,
    getMyAccount, updateMyAccount, deleteMyAccount,
    getUserById, followUser,
    unfollowUser, checkFollowing,
    getFollowers, getFollowing,
    getFollowingUsersList
} from "../controller/userController";

import { getAllUsers } from "../services/userService";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/ping", (req, res) => {
    res.json({ message: "router funcionando" });
});

router.post("/register", registerUser);
router.post("/login", login);
router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/confirm", resetPassword);
router.get("/me", authMiddleware, getMyAccount);
router.put("/me", authMiddleware, updateMyAccount);
router.delete("/me", authMiddleware, deleteMyAccount);
router.get("/", async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
});
router.get("/:id/following/list", getFollowingUsersList);
router.get("/:id", getUserById);
router.post("/:id/follow", authMiddleware, followUser);
router.delete("/:id/follow", authMiddleware, unfollowUser);
router.get("/:id/is-following/:idSeguidor", authMiddleware, checkFollowing);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

export default router;