import { Router } from "express";

import { registerUser, login,
    getUserById, followUser,
    unfollowUser, checkFollowing,
    getFollowers, getFollowing,
    getFollowingUsersList
} from "../controller/userController";

import { getAllUsers } from "../services/userService";

const router = Router();

router.get("/ping", (req, res) => {
    res.json({ message: "router funcionando" });
});

router.post("/register", registerUser);
router.post("/login", login);
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
router.post("/:id/follow", followUser);
router.delete("/:id/follow", unfollowUser);
router.get("/:id/is-following/:idSeguidor", checkFollowing);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);


export default router;