import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
    createProject,
    listProjects,
    getProject,
    updateProject,
    archiveProject,
    deleteProject,
    addProjectMember,
    listProjectMembers,
    changeProjectMemberRole,
    removeProjectMember,
} from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
    requireProjectAccess,
    requireProjectLeadOrOrgAdmin,
} from "../middleware/project.middleware.js";

import { searchProjects } from "../controllers/search.controller.js";

const router: ExpressRouter = Router({ mergeParams: true });

// All project routes require authentication
router.use(requireAuth);

router.post("/", createProject);
router.get("/", listProjects);
router.get("/search", searchProjects);

router.get("/:id", requireProjectAccess, getProject);
router.patch("/:id", requireProjectAccess, requireProjectLeadOrOrgAdmin, updateProject);
router.patch("/:id/archive", requireProjectAccess, requireProjectLeadOrOrgAdmin, archiveProject);
router.delete("/:id", requireProjectAccess, requireProjectLeadOrOrgAdmin, deleteProject);

router.get("/:id/members", requireProjectAccess, listProjectMembers);
router.post("/:id/members", requireProjectAccess, requireProjectLeadOrOrgAdmin, addProjectMember);
router.patch("/:id/members/:memberId/role", requireProjectAccess, requireProjectLeadOrOrgAdmin, changeProjectMemberRole);
router.delete("/:id/members/:memberId", requireProjectAccess, requireProjectLeadOrOrgAdmin, removeProjectMember);

import { createTask, listTasks } from "../controllers/task.controller.js";
router.post("/:projectId/tasks", createTask);
router.get("/:projectId/tasks", listTasks);
router.post("/:id/tasks", createTask);
router.get("/:id/tasks", listTasks);

export default router;
