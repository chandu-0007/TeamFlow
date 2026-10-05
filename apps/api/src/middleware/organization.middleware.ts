import type { Request, Response, NextFunction } from "express";
import { prisma, type OrganizationMember, OrganizationRole } from "@teamflow/db";

declare global {
    namespace Express {
        interface Request {
            membership?: OrganizationMember;
        }
    }
}

const roleHierarchy: Record<OrganizationRole, number> = {
    OWNER: 5,
    ADMIN: 4,
    MANAGER: 3,
    MEMBER: 2,
    VIEWER: 1,
};

function getParam(param: string | string[] | undefined): string {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
}

// Middleware to verify user is a member of the organization
export async function requireOrgMember(req: Request, res: Response, next: NextFunction) {
    if (!req.user?.userId) {
        return res.status(401).json({
            message: "Authentication required",
        });
    }

    const organizationId = getParam(req.params.id) || getParam(req.params.organizationId);

    if (!organizationId) {
        return res.status(400).json({
            message: "Organization ID is required",
        });
    }

    try {
        const membership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.userId,
                    organizationId,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                message: "Access denied. You are not a member of this organization.",
            });
        }

        req.membership = membership;
        return next();
    } catch (error) {
        console.error("requireOrgMember error:", error);
        return res.status(500).json({
            message: "Error verifying organization membership",
        });
    }
}

// Higher-order middleware to enforce minimum role in an organization
export function requireOrgRole(minRole: OrganizationRole) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.membership) {
            return res.status(403).json({
                message: "Membership verification required",
            });
        }

        const userRoleRank = roleHierarchy[req.membership.role];
        const requiredRoleRank = roleHierarchy[minRole];

        if (userRoleRank < requiredRoleRank) {
            return res.status(403).json({
                message: `Insufficient permissions. Requires '${minRole}' or higher. Your role: '${req.membership.role}'`,
            });
        }

        return next();
    };
}
