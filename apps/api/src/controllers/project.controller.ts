import type { Request, Response } from "express";
import z from "zod";
import crypto from "crypto";
import {
    prisma,
    type ProjectRole,
    type ProjectStatus,
    type Prisma,
} from "@teamflow/db";
import { parsePagination, parseSorting, buildPaginationMeta } from "../utils/query.utils.js";

function getParam(param: string | string[] | undefined): string {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// ----------------------------------------------------
// Validation Schemas
// ----------------------------------------------------
const CreateProjectValidation = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens").optional(),
    description: z.string().max(1000).optional(),
    organizationId: z.string().uuid("Invalid organization ID").optional(),
});

const UpdateProjectValidation = z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().max(1000).optional().nullable(),
});

const ArchiveProjectValidation = z.object({
    status: z.enum(["ACTIVE", "ARCHIVED"] as const).optional(),
});

const AddProjectMemberValidation = z.object({
    userId: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    role: z.enum(["TEAMLEAD", "MEMBER"] as const).default("MEMBER"),
}).refine(data => data.userId || data.email, {
    message: "Either userId or email must be provided to add a member",
});

const ChangeProjectMemberRoleValidation = z.object({
    role: z.enum(["TEAMLEAD", "MEMBER"] as const),
});

// ----------------------------------------------------
// 1. Create Project
// ----------------------------------------------------
export async function createProject(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const organizationId = getParam(req.params.organizationId) || req.body.organizationId;
    if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
    }

    const result = CreateProjectValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { name, description } = result.data;
    let baseSlug = result.data.slug ? slugify(result.data.slug) : slugify(name);
    if (!baseSlug) baseSlug = "project";

    try {
        // Verify caller is a member of the organization
        const orgMembership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.userId,
                    organizationId,
                },
            },
        });

        if (!orgMembership) {
            return res.status(403).json({
                message: "Access denied. You are not a member of this organization.",
            });
        }

        // Only Manager or higher can create projects (or customize per policy)
        if (orgMembership.role === "VIEWER") {
            return res.status(403).json({
                message: "Viewers cannot create projects in this organization.",
            });
        }

        // Ensure unique slug within this organization
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.project.findUnique({
            where: {
                organizationId_slug: { organizationId, slug },
            },
        })) {
            slug = `${baseSlug}-${counter}-${crypto.randomBytes(2).toString("hex")}`;
            counter++;
        }

        const project = await prisma.$transaction(async (tx) => {
            const newProj = await tx.project.create({
                data: {
                    name,
                    slug,
                    description: description || null,
                    status: "ACTIVE",
                    createdBy: req.user!.userId,
                    organizationId,
                },
            });

            // Creator is automatically assigned as TEAMLEAD
            await tx.projectMember.create({
                data: {
                    projectId: newProj.id,
                    userId: req.user!.userId,
                    role: "TEAMLEAD",
                },
            });

            return newProj;
        });

        return res.status(201).json({
            message: "Project created successfully",
            project,
        });
    } catch (error) {
        console.error("createProject error:", error);
        return res.status(500).json({ message: "Internal server error creating project" });
    }
}

// ----------------------------------------------------
// 2. List Projects in Organization
// ----------------------------------------------------
export async function listProjects(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const organizationId = getParam(req.params.organizationId) || (typeof req.query.organizationId === "string" ? req.query.organizationId : "");
    if (!organizationId) {
        return res.status(400).json({ message: "Organization ID is required" });
    }

    try {
        const orgMembership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.userId,
                    organizationId,
                },
            },
        });

        if (!orgMembership) {
            return res.status(403).json({
                message: "Access denied. You are not a member of this organization.",
            });
        }

        const { search, status, sortBy: querySortBy, order: queryOrder, page: queryPage, limit: queryLimit } = req.query;

        const where: Prisma.ProjectWhereInput = {
            organizationId,
        };

        if (typeof status === "string" && (status === "ACTIVE" || status === "ARCHIVED")) {
            where.status = status as ProjectStatus;
        }

        if (typeof search === "string" && search.trim()) {
            const trimmed = search.trim();
            where.OR = [
                { name: { contains: trimmed, mode: "insensitive" } },
                { slug: { contains: trimmed, mode: "insensitive" } },
                { description: { contains: trimmed, mode: "insensitive" } },
            ];
        }

        const { page, limit, skip, take } = parsePagination(queryPage, queryLimit, 20);
        const { sortBy, order } = parseSorting(
            querySortBy,
            queryOrder,
            ["createdAt", "updatedAt", "name", "status"] as const,
            "createdAt",
            "desc"
        );

        const orderBy: Prisma.ProjectOrderByWithRelationInput = {
            [sortBy]: order,
        };

        const [total, projects] = await Promise.all([
            prisma.project.count({ where }),
            prisma.project.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    creator: {
                        select: { id: true, name: true, email: true },
                    },
                    projectMembers: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                        },
                    },
                    _count: {
                        select: { projectMembers: true, tasks: true },
                    },
                },
            }),
        ]);

        return res.status(200).json({
            ...buildPaginationMeta(total, page, limit, projects.length),
            projects,
        });
    } catch (error) {
        console.error("listProjects error:", error);
        return res.status(500).json({ message: "Internal server error listing projects" });
    }
}

// ----------------------------------------------------
// 3. Get Project Details
// ----------------------------------------------------
export async function getProject(req: Request, res: Response) {
    const projectId = getParam(req.params.id) || getParam(req.params.projectId);

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                organization: {
                    select: { id: true, name: true, slug: true },
                },
                creator: {
                    select: { id: true, name: true, email: true },
                },
                projectMembers: {
                    include: {
                        user: { select: { id: true, name: true, email: true } },
                    },
                    orderBy: { createdAt: "asc" },
                },
                _count: {
                    select: { projectMembers: true },
                },
            },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        return res.status(200).json({
            project,
            userProjectRole: req.projectMembership?.role || null,
        });
    } catch (error) {
        console.error("getProject error:", error);
        return res.status(500).json({ message: "Internal server error fetching project" });
    }
}

// ----------------------------------------------------
// 4. Update Project
// ----------------------------------------------------
export async function updateProject(req: Request, res: Response) {
    const projectId = getParam(req.params.id) || getParam(req.params.projectId);

    const result = UpdateProjectValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    try {
        const data: any = { ...result.data };

        if (data.slug) {
            const existing = await prisma.project.findFirst({
                where: {
                    organizationId: req.project!.organizationId,
                    slug: data.slug,
                    NOT: { id: projectId },
                },
            });
            if (existing) {
                return res.status(409).json({ message: "This project slug is already taken in this organization" });
            }
        }

        const project = await prisma.project.update({
            where: { id: projectId },
            data,
        });

        return res.status(200).json({
            message: "Project updated successfully",
            project,
        });
    } catch (error) {
        console.error("updateProject error:", error);
        return res.status(500).json({ message: "Internal server error updating project" });
    }
}

// ----------------------------------------------------
// 5. Archive Project
// ----------------------------------------------------
export async function archiveProject(req: Request, res: Response) {
    const projectId = getParam(req.params.id) || getParam(req.params.projectId);

    const result = ArchiveProjectValidation.safeParse(req.body || {});
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    try {
        // Toggle or set specified status
        const nextStatus: ProjectStatus = result.data.status
            ? result.data.status
            : (req.project!.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE");

        const project = await prisma.project.update({
            where: { id: projectId },
            data: { status: nextStatus },
        });

        return res.status(200).json({
            message: `Project ${nextStatus === "ARCHIVED" ? "archived" : "unarchived"} successfully`,
            project,
        });
    } catch (error) {
        console.error("archiveProject error:", error);
        return res.status(500).json({ message: "Internal server error changing project status" });
    }
}

// ----------------------------------------------------
// 6. Delete Project
// ----------------------------------------------------
export async function deleteProject(req: Request, res: Response) {
    const projectId = getParam(req.params.id) || getParam(req.params.projectId);

    try {
        await prisma.project.delete({
            where: { id: projectId },
        });

        return res.status(200).json({
            message: "Project deleted successfully",
        });
    } catch (error) {
        console.error("deleteProject error:", error);
        return res.status(500).json({ message: "Internal server error deleting project" });
    }
}

// ----------------------------------------------------
// 7. Add Project Member
// ----------------------------------------------------
export async function addProjectMember(req: Request, res: Response) {
    const projectId = getParam(req.params.id) || getParam(req.params.projectId);

    const result = AddProjectMemberValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { userId, email, role } = result.data;

    try {
        let targetUser = null;
        if (userId) {
            targetUser = await prisma.user.findUnique({ where: { id: userId } });
        } else if (email) {
            targetUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        }

        if (!targetUser) {
            return res.status(404).json({ message: "Target user not found" });
        }

        // Verify target user is a member of the parent organization
        const orgMember = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: targetUser.id,
                    organizationId: req.project!.organizationId,
                },
            },
        });

        if (!orgMember) {
            return res.status(400).json({
                message: "User must be a member of the organization before joining this project.",
            });
        }

        // Check if already in project
        const existingProjectMember = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: targetUser.id,
                },
            },
        });

        if (existingProjectMember) {
            return res.status(409).json({
                message: "User is already a member of this project",
            });
        }

        const member = await prisma.projectMember.create({
            data: {
                projectId,
                userId: targetUser.id,
                role: role as ProjectRole,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return res.status(201).json({
            message: "Project member added successfully",
            member,
        });
    } catch (error) {
        console.error("addProjectMember error:", error);
        return res.status(500).json({ message: "Internal server error adding project member" });
    }
}

// ----------------------------------------------------
// 8. List Project Members
// ----------------------------------------------------
export async function listProjectMembers(req: Request, res: Response) {
    const projectId = getParam(req.params.id) || getParam(req.params.projectId);

    try {
        const { search, role, sortBy: querySortBy, order: queryOrder, page: queryPage, limit: queryLimit } = req.query;

        const where: Prisma.ProjectMemberWhereInput = {
            projectId,
        };

        if (typeof role === "string" && (role === "TEAMLEAD" || role === "MEMBER")) {
            where.role = role as ProjectRole;
        }

        if (typeof search === "string" && search.trim()) {
            const trimmed = search.trim();
            where.user = {
                OR: [
                    { name: { contains: trimmed, mode: "insensitive" } },
                    { email: { contains: trimmed, mode: "insensitive" } },
                ],
            };
        }

        const { page, limit, skip, take } = parsePagination(queryPage, queryLimit, 20);
        const { sortBy, order } = parseSorting(
            querySortBy,
            queryOrder,
            ["createdAt", "role", "name", "email"] as const,
            "createdAt",
            "asc"
        );

        let orderBy: Prisma.ProjectMemberOrderByWithRelationInput;
        if (sortBy === "name" || sortBy === "email") {
            orderBy = { user: { [sortBy]: order } };
        } else {
            orderBy = { [sortBy]: order };
        }

        const [total, members] = await Promise.all([
            prisma.projectMember.count({ where }),
            prisma.projectMember.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            }),
        ]);

        return res.status(200).json({
            ...buildPaginationMeta(total, page, limit, members.length),
            members,
        });
    } catch (error) {
        console.error("listProjectMembers error:", error);
        return res.status(500).json({ message: "Internal server error listing project members" });
    }
}

// ----------------------------------------------------
// 9. Change Project Member Role
// ----------------------------------------------------
export async function changeProjectMemberRole(req: Request, res: Response) {
    const projectId = getParam(req.params.id) || getParam(req.params.projectId);
    const memberId = getParam(req.params.memberId);

    const result = ChangeProjectMemberRoleValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { role } = result.data;

    try {
        const targetMember = await prisma.projectMember.findFirst({
            where: {
                projectId,
                OR: [{ id: memberId }, { userId: memberId }],
            },
        });

        if (!targetMember) {
            return res.status(404).json({ message: "Member not found in this project" });
        }

        const updated = await prisma.projectMember.update({
            where: { id: targetMember.id },
            data: { role: role as ProjectRole },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return res.status(200).json({
            message: "Project member role updated successfully",
            member: updated,
        });
    } catch (error) {
        console.error("changeProjectMemberRole error:", error);
        return res.status(500).json({ message: "Internal server error updating project member role" });
    }
}

// ----------------------------------------------------
// 10. Remove Project Member
// ----------------------------------------------------
export async function removeProjectMember(req: Request, res: Response) {
    const projectId = getParam(req.params.id) || getParam(req.params.projectId);
    const memberId = getParam(req.params.memberId);

    try {
        const targetMember = await prisma.projectMember.findFirst({
            where: {
                projectId,
                OR: [{ id: memberId }, { userId: memberId }],
            },
            include: { user: { select: { name: true } } },
        });

        if (!targetMember) {
            return res.status(404).json({ message: "Member not found in this project" });
        }

        await prisma.projectMember.delete({
            where: { id: targetMember.id },
        });

        return res.status(200).json({
            message: `Member ${targetMember.user.name} removed from project successfully`,
        });
    } catch (error) {
        console.error("removeProjectMember error:", error);
        return res.status(500).json({ message: "Internal server error removing project member" });
    }
}
