import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
    globalSearch,
    searchProjects,
    searchTasks,
} from "../controllers/search.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router: ExpressRouter = Router();

// Authentication required for all search operations
router.use(requireAuth);

// 1. Unified Multi-Entity Global Search (Projects + Tasks + Members)
// GET /api/search?organizationId=uuid&q=keyword&type=all|projects|tasks|members&limit=10
router.get("/", globalSearch);

// 2. Dedicated Projects Search
// GET /api/search/projects?organizationId=uuid&q=keyword&status=ACTIVE&page=1&limit=20
router.get("/projects", searchProjects);

// 3. Dedicated Tasks Search (across all projects in organization)
// GET /api/search/tasks?organizationId=uuid&projectId=uuid&q=keyword&status=TODO&priority=HIGH&page=1&limit=20
router.get("/tasks", searchTasks);

export default router;
