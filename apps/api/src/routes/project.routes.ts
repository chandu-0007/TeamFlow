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

const router: ExpressRouter = Router({ mergeParams: true });

// All project routes require authentication
router.use(requireAuth);

// ----------------------------------------------------
// Project Collection
// ----------------------------------------------------
router.post("/", createProject);
router.get("/", listProjects);

// ----------------------------------------------------
// Project Instance Operations
// ----------------------------------------------------
router.get("/:id", requireProjectAccess, getProject);
router.patch("/:id", requireProjectAccess, requireProjectLeadOrOrgAdmin, updateProject);
router.patch("/:id/archive", requireProjectAccess, requireProjectLeadOrOrgAdmin, archiveProject);
router.delete("/:id", requireProjectAccess, requireProjectLeadOrOrgAdmin, deleteProject);

// ----------------------------------------------------
// Project Members Management
// ----------------------------------------------------
router.get("/:id/members", requireProjectAccess, listProjectMembers);
router.post("/:id/members", requireProjectAccess, requireProjectLeadOrOrgAdmin, addProjectMember);
router.patch("/:id/members/:memberId/role", requireProjectAccess, requireProjectLeadOrOrgAdmin, changeProjectMemberRole);
router.delete("/:id/members/:memberId", requireProjectAccess, requireProjectLeadOrOrgAdmin, removeProjectMember);

export default router;
