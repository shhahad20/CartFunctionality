import { Router } from "express";
import { getMe, login, protect, register } from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);

// protected route
router.get("/me", protect, getMe);


export default router;