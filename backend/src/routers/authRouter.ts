import { Router } from "express";
import { getMe, login, logout, protect, register } from "../controllers/authController";
import { log } from "node:console";

const router = Router();

router.post("/register", register);
router.post("/login", login);
// router.post("/refresh", refresh);
// protected route
router.get("/me", protect, getMe);
router.post("/logout", logout);


export default router;