import type { Request, Response } from "express";
import {
    prisma,
    type ProjectStatus,
    type TaskStatus,
    type TaskPriority,
    type Prisma,
} from "@teamflow/db";
import { parsePagination, parseSorting, buildPaginationMeta } from "../utils/query.utils.js";

function getParam(param: string | string[] | undefined): string {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
}

/**
 * Resolves the allowed organization IDs for the authenticated caller.
 * If a specific organizationId is requested, validates that the caller is an active member.
 * If no organizationId is requested, returns all organization IDs the caller belongs to.
 */
async function resolveUserOrgIds(
    userId: string,
    requestedOrgId?: string
): Promise<{ allowedOrgIds: string[]; error?: { status: number; message: string } }> {
    const memberships = await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true },
    });

    const userOrgIds = memberships.map((m) => m.organizationId);

    if (requestedOrgId) {
        if (!userOrgIds.includes(requestedOrgId)) {
            return {
                allowedOrgIds: [],
                error: {
                    status: 403,
                    message: "Access denied. You are not a member of the requested organization.",
                },
            };
        }
        return { allowedOrgIds: [requestedOrgId] };
    }

    return { allowedOrgIds: userOrgIds };
}

/**
 * 1. Unified Global Search: Search Organizations, Projects, Tasks, and Members
 * GET /api/search?q=keyword&organizationId=uuid&type=all|organizations|projects|tasks|members&limit=10
 * If organizationId is omitted, searches across ALL organizations the authenticated user belongs to.
 */
export async function globalSearch(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const requestedOrgId =
        getParam(req.params.organizationId) ||
        getParam(req.params.id) ||
        (typeof req.query.organizationId === "string" ? req.query.organizationId.trim() : "") ||
        undefined;

    try {
        const { allowedOrgIds, error } = await resolveUserOrgIds(req.user.userId, requestedOrgId);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        const rawQuery = (
            typeof req.query.q === "string"
                ? req.query.q
                : typeof req.query.query === "string"
                ? req.query.query
                : ""
        ).trim();

        const type = (typeof req.query.type === "string" ? req.query.type.toLowerCase() : "all");
        const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));

        if (!rawQuery || allowedOrgIds.length === 0) {
            return res.status(200).json({
                query: rawQuery,
                scopedOrganizationId: requestedOrgId || null,
                counts: { organizations: 0, projects: 0, tasks: 0, members: 0, total: 0 },
                results: { organizations: [], projects: [], tasks: [], members: [] },
            });
        }

        const searchOrgs = type === "all" || type === "organizations";
        const searchProjects = type === "all" || type === "projects";
        const searchTasks = type === "all" || type === "tasks";
        const searchMembers = type === "all" || type === "members";

        const [organizations, projects, tasks, members] = await Promise.all([
            searchOrgs
                ? prisma.organization.findMany({
                      where: {
                          id: { in: allowedOrgIds },
                          OR: [
                              { name: { contains: rawQuery, mode: "insensitive" } },
                              { slug: { contains: rawQuery, mode: "insensitive" } },
                              { description: { contains: rawQuery, mode: "insensitive" } },
                          ],
                      },
                      take: limit,
                      select: {
                          id: true,
                          name: true,
                          slug: true,
                          description: true,
                          websiteUrl: true,
                          logoUrl: true,
                          createdAt: true,
                      },
                      orderBy: { name: "asc" },
                  })
                : Promise.resolve([]),

            searchProjects
                ? prisma.project.findMany({
                      where: {
                          organizationId: { in: allowedOrgIds },
                          OR: [
                              { name: { contains: rawQuery, mode: "insensitive" } },
                              { slug: { contains: rawQuery, mode: "insensitive" } },
                              { description: { contains: rawQuery, mode: "insensitive" } },
                          ],
                      },
                      take: limit,
                      select: {
                          id: true,
                          name: true,
                          slug: true,
                          description: true,
                          status: true,
                          organizationId: true,
                          organization: {
                              select: { id: true, name: true, slug: true },
                          },
                          createdAt: true,
                          updatedAt: true,
                      },
                      orderBy: { updatedAt: "desc" },
                  })
                : Promise.resolve([]),

            searchTasks
                ? prisma.task.findMany({
                      where: {
                          project: { organizationId: { in: allowedOrgIds } },
                          OR: [
                              { title: { contains: rawQuery, mode: "insensitive" } },
                              { description: { contains: rawQuery, mode: "insensitive" } },
                          ],
                      },
                      take: limit,
                      include: {
                          project: {
                              select: { id: true, name: true, slug: true, organizationId: true },
                          },
                          assignee: {
                              select: { id: true, name: true, email: true },
                          },
                          creator: {
                              select: { id: true, name: true, email: true },
                          },
                      },
                      orderBy: { updatedAt: "desc" },
                  })
                : Promise.resolve([]),

            searchMembers
                ? prisma.organizationMember.findMany({
                      where: {
                          organizationId: { in: allowedOrgIds },
                          user: {
                              OR: [
                                  { name: { contains: rawQuery, mode: "insensitive" } },
                                  { email: { contains: rawQuery, mode: "insensitive" } },
                              ],
                          },
                      },
                      take: limit,
                      include: {
                          user: {
                              select: { id: true, name: true, email: true },
                          },
                          organization: {
                              select: { id: true, name: true, slug: true },
                          },
                      },
                      orderBy: { createdAt: "asc" },
                  })
                : Promise.resolve([]),
        ]);

        const formattedMembers = members.map((m) => ({
            id: m.id,
            role: m.role,
            organizationId: m.organizationId,
            organization: m.organization,
            user: m.user,
            joinedAt: m.createdAt,
        }));

        const totalResults =
            organizations.length + projects.length + tasks.length + formattedMembers.length;

        return res.status(200).json({
            query: rawQuery,
            scopedOrganizationId: requestedOrgId || null,
            counts: {
                organizations: organizations.length,
                projects: projects.length,
                tasks: tasks.length,
                members: formattedMembers.length,
                total: totalResults,
            },
            results: {
                organizations,
                projects,
                tasks,
                members: formattedMembers,
            },
        });
    } catch (error) {
        console.error("globalSearch error:", error);
        return res.status(500).json({ message: "Internal server error performing global search" });
    }
}

/**
 * 2. Dedicated Projects Search
 * GET /api/search/projects?q=keyword&organizationId=uuid&status=ACTIVE&page=1&limit=20
 */
export async function searchProjects(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const requestedOrgId =
        getParam(req.params.organizationId) ||
        (typeof req.query.organizationId === "string" ? req.query.organizationId.trim() : "") ||
        undefined;

    try {
        const { allowedOrgIds, error } = await resolveUserOrgIds(req.user.userId, requestedOrgId);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        const rawQuery = (
            typeof req.query.q === "string"
                ? req.query.q
                : typeof req.query.search === "string"
                ? req.query.search
                : ""
        ).trim();

        const status =
            typeof req.query.status === "string" && (req.query.status === "ACTIVE" || req.query.status === "ARCHIVED")
                ? (req.query.status as ProjectStatus)
                : undefined;

        const where: Prisma.ProjectWhereInput = {
            organizationId: { in: allowedOrgIds },
            ...(status ? { status } : {}),
            ...(rawQuery
                ? {
                      OR: [
                          { name: { contains: rawQuery, mode: "insensitive" } },
                          { slug: { contains: rawQuery, mode: "insensitive" } },
                          { description: { contains: rawQuery, mode: "insensitive" } },
                      ],
                  }
                : {}),
        };

        const { page, limit, skip, take } = parsePagination(req.query.page, req.query.limit, 20);
        const { sortBy, order } = parseSorting(
            req.query.sortBy,
            req.query.order,
            ["createdAt", "updatedAt", "name", "status"] as const,
            "updatedAt",
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
                    },
                    _count: {
                        select: { projectMembers: true, tasks: true },
                    },
                },
            }),
        ]);

        return res.status(200).json({
            query: rawQuery,
            scopedOrganizationId: requestedOrgId || null,
            ...buildPaginationMeta(total, page, limit, projects.length),
            projects,
        });
    } catch (error) {
        console.error("searchProjects error:", error);
        return res.status(500).json({ message: "Internal server error searching projects" });
    }
}

/**
 * 3. Dedicated Tasks Search
 * GET /api/search/tasks?q=keyword&organizationId=uuid&projectId=uuid&status=TODO&priority=HIGH&page=1&limit=20
 */
export async function searchTasks(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const requestedOrgId =
        getParam(req.params.organizationId) ||
        (typeof req.query.organizationId === "string" ? req.query.organizationId.trim() : "") ||
        undefined;

    try {
        const { allowedOrgIds, error } = await resolveUserOrgIds(req.user.userId, requestedOrgId);
        if (error) {
            return res.status(error.status).json({ message: error.message });
        }

        const rawQuery = (
            typeof req.query.q === "string"
                ? req.query.q
                : typeof req.query.search === "string"
                ? req.query.search
                : ""
        ).trim();

        const projectId = typeof req.query.projectId === "string" && req.query.projectId.trim() ? req.query.projectId.trim() : undefined;
        const status =
            typeof req.query.status === "string" && ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].includes(req.query.status)
                ? (req.query.status as TaskStatus)
                : undefined;
        const priority =
            typeof req.query.priority === "string" && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(req.query.priority)
                ? (req.query.priority as TaskPriority)
                : undefined;
        const assigneeId = typeof req.query.assigneeId === "string" ? req.query.assigneeId : undefined;

        const where: Prisma.TaskWhereInput = {
            project: {
                organizationId: { in: allowedOrgIds },
                ...(projectId ? { id: projectId } : {}),
            },
            ...(status ? { status } : {}),
            ...(priority ? { priority } : {}),
            ...(assigneeId ? { assigneeId: assigneeId === "unassigned" ? null : assigneeId } : {}),
            ...(rawQuery
                ? {
                      OR: [
                          { title: { contains: rawQuery, mode: "insensitive" } },
                          { description: { contains: rawQuery, mode: "insensitive" } },
                      ],
                  }
                : {}),
        };

        const { page, limit, skip, take } = parsePagination(req.query.page, req.query.limit, 20);
        const { sortBy, order } = parseSorting(
            req.query.sortBy,
            req.query.order,
            ["createdAt", "updatedAt", "priority", "status", "title"] as const,
            "updatedAt",
            "desc"
        );

        const orderBy: Prisma.TaskOrderByWithRelationInput = {
            [sortBy]: order,
        };

        const [total, tasks] = await Promise.all([
            prisma.task.count({ where }),
            prisma.task.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    project: {
                        select: { id: true, name: true, slug: true, organizationId: true },
                    },
                    assignee: {
                        select: { id: true, name: true, email: true },
                    },
                    creator: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
        ]);

        return res.status(200).json({
            query: rawQuery,
            scopedOrganizationId: requestedOrgId || null,
            ...buildPaginationMeta(total, page, limit, tasks.length),
            tasks,
        });
    } catch (error) {
        console.error("searchTasks error:", error);
        return res.status(500).json({ message: "Internal server error searching tasks" });
    }
}
