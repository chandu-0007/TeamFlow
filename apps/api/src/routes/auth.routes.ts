import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
    signup,
    signin,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
} from "../controllers/auth.controller.js";
import { sendOtp, verifyEmail } from "../controllers/email.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router: ExpressRouter = Router();

// Authentication
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

// Email Verification
router.post("/email/send", sendOtp);
router.post("/email/verify", verifyEmail);

// Password Reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
