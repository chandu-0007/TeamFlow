import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
    createOrganization,
    listUserOrganizations,
    getOrganization,
    updateOrganization,
    deleteOrganization,
    inviteMember,
    acceptInvitation,
    removeMember,
    changeMemberRole,
    leaveOrganization,
    listMembers,
    listInvitations,
} from "../controllers/organization.controller.js";
import { globalSearch } from "../controllers/search.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireOrgMember, requireOrgRole } from "../middleware/organization.middleware.js";

const router: ExpressRouter = Router();

// All organization routes require user authentication
router.use(requireAuth);

// ----------------------------------------------------
// Organization Collection & Invitations
// ----------------------------------------------------
router.post("/", createOrganization);
router.get("/", listUserOrganizations);
router.post("/invitations/accept", acceptInvitation);

// ----------------------------------------------------
// Organization Instance Operations
// ----------------------------------------------------
router.get("/:id", requireOrgMember, getOrganization);
router.get("/:id/search", requireOrgMember, globalSearch);
router.patch("/:id", requireOrgMember, requireOrgRole("ADMIN"), updateOrganization);
router.delete("/:id", requireOrgMember, requireOrgRole("OWNER"), deleteOrganization);
router.post("/:id/leave", requireOrgMember, leaveOrganization);

// ----------------------------------------------------
// Member Management
// ----------------------------------------------------
router.get("/:id/members", requireOrgMember, listMembers);
router.delete("/:id/members/:memberId", requireOrgMember, requireOrgRole("ADMIN"), removeMember);
router.patch("/:id/members/:memberId/role", requireOrgMember, requireOrgRole("ADMIN"), changeMemberRole);

// ----------------------------------------------------
// Invitation Management for Organization
// ----------------------------------------------------
router.post("/:id/invitations", requireOrgMember, requireOrgRole("MANAGER"), inviteMember);
router.post("/:id/invite", requireOrgMember, requireOrgRole("MANAGER"), inviteMember);
router.get("/:id/invitations", requireOrgMember, requireOrgRole("MANAGER"), listInvitations);

// ----------------------------------------------------
// Projects for Organization
// ----------------------------------------------------
import projectRouter from "./project.routes.js";
router.use("/:organizationId/projects", projectRouter);

export default router;
