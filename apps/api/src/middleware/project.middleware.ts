import type { Request, Response, NextFunction } from "express";
import {
    prisma,
    type Project,
    type Organization,
    type ProjectMember,
    type OrganizationMember,
} from "@teamflow/db";

declare global {
    namespace Express {
        interface Request {
            project?: Project & { organization?: Organization };
            projectMembership?: ProjectMember | null;
        }
    }
}

function getParam(param: string | string[] | undefined): string {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
}

// Middleware to verify user has access to the project via organization membership
export async function requireProjectAccess(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const projectId = getParam(req.params.id) || getParam(req.params.projectId);
    if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { organization: true },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Verify caller is a member of the parent organization
        const orgMembership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.userId,
                    organizationId: project.organizationId,
                },
            },
        });

        if (!orgMembership) {
            return res.status(403).json({
                message: "Access denied. You are not a member of this organization.",
            });
        }

        // Check if user is also directly a project member
        const projectMembership = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId: project.id,
                    userId: req.user.userId,
                },
            },
        });

        req.project = project;
        req.membership = orgMembership;
        req.projectMembership = projectMembership;

        return next();
    } catch (error) {
        console.error("requireProjectAccess error:", error);
        return res.status(500).json({ message: "Error verifying project access" });
    }
}

// Middleware requiring TeamLead, Org Admin, or Org Owner role
export function requireProjectLeadOrOrgAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.project || !req.membership) {
        return res.status(403).json({ message: "Project access verification required" });
    }

    const isOrgAdminOrOwner = req.membership.role === "OWNER" || req.membership.role === "ADMIN";
    const isProjectCreator = req.project.createdBy === req.user?.userId;
    const isProjectTeamLead = req.projectMembership?.role === "TEAMLEAD";

    if (!isOrgAdminOrOwner && !isProjectCreator && !isProjectTeamLead) {
        return res.status(403).json({
            message: "Insufficient permissions. Requires Project TeamLead, Organization Admin, or Owner.",
        });
    }

    return next();
}
