import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
    getTask,
    updateTask,
    deleteTask,
} from "../controllers/task.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router: ExpressRouter = Router();

// All task routes require authentication
router.use(requireAuth);

// ----------------------------------------------------
// Task Instance Operations
// ----------------------------------------------------
router.get("/:taskId", getTask);
router.patch("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

export default router;
