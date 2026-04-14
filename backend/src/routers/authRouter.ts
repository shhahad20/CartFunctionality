import { Router } from "express";
import { changePassword, forgotPassword, getMe, login, logout, protect, register, resetPassword } from "../controllers/authController";
import { log } from "node:console";

const router = Router();

router.post("/register", register);
router.post("/login", login);
// router.post("/refresh", refresh);
// protected route
router.get("/me", protect, getMe);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);

export default router;