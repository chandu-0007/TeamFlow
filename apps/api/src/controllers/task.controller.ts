import type { Request, Response } from "express";
import z from "zod";
import {
    prisma,
    type TaskStatus,
    type TaskPriority,
    type Prisma,
} from "@teamflow/db";

function getParam(param: string | string[] | undefined): string {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
}


const CreateTaskValidation = z.object({
    title: z.string().min(1, "Task title is required").max(200, "Title must not exceed 200 characters"),
    description: z.string().max(5000, "Description must not exceed 5000 characters").optional().nullable(),
    status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const).default("BACKLOG"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).default("MEDIUM"),
    assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
});

const UpdateTaskValidation = z.object({
    title: z.string().min(1, "Title cannot be empty").max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).optional(),
    assigneeId: z.string().uuid("Invalid assignee ID").optional().nullable(),
});

// ----------------------------------------------------
// 1. Create Task (POST /projects/:projectId/tasks)
// ----------------------------------------------------
export async function createTask(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const projectId = getParam(req.params.projectId) || getParam(req.params.id);
    if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
    }

    const result = CreateTaskValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { title, description, status, priority, assigneeId } = result.data;

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, status: true, organizationId: true },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.status === "ARCHIVED") {
            return res.status(400).json({
                message: "Cannot create tasks in an archived project. Please unarchive it first.",
            });
        }

        // Verify caller is a member of the project's parent organization
        const callerOrgMembership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.userId,
                    organizationId: project.organizationId,
                },
            },
        });

        if (!callerOrgMembership) {
            return res.status(403).json({
                message: "Access denied. You are not a member of this project's organization.",
            });
        }

        // If assigneeId is provided, verify assignee belongs to the organization
        if (assigneeId) {
            const assigneeOrgMembership = await prisma.organizationMember.findUnique({
                where: {
                    userId_organizationId: {
                        userId: assigneeId,
                        organizationId: project.organizationId,
                    },
                },
            });

            if (!assigneeOrgMembership) {
                return res.status(400).json({
                    message: "The assigned user is not a member of this organization.",
                });
            }
        }

        const task = await prisma.task.create({
            data: {
                title,
                description: description || null,
                status: status || "BACKLOG",
                priority: priority || "MEDIUM",
                projectId,
                createdBy: req.user.userId,
                assigneeId: assigneeId || null,
            },
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
                assignee: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return res.status(201).json({
            message: "Task created successfully",
            task,
        });
    } catch (error) {
        console.error("createTask error:", error);
        return res.status(500).json({ message: "Internal server error creating task" });
    }
}

// ----------------------------------------------------
// 2. List Tasks in Project (GET /projects/:projectId/tasks)
// ----------------------------------------------------
export async function listTasks(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const projectId = getParam(req.params.projectId) || getParam(req.params.id);
    if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, organizationId: true },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Verify caller is a member of the parent organization
        const callerOrgMembership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.userId,
                    organizationId: project.organizationId,
                },
            },
        });

        if (!callerOrgMembership) {
            return res.status(403).json({
                message: "Access denied. You are not a member of this project's organization.",
            });
        }

        // Filter parameters
        const {
            status,
            priority,
            assigneeId,
            search,
            sortBy = "createdAt",
            order = "desc",
            page = "1",
            limit = "50",
        } = req.query;

        const where: Prisma.TaskWhereInput = {
            projectId,
        };

        if (typeof status === "string" && ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].includes(status)) {
            where.status = status as TaskStatus;
        }

        if (typeof priority === "string" && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
            where.priority = priority as TaskPriority;
        }

        if (typeof assigneeId === "string") {
            where.assigneeId = assigneeId === "unassigned" ? null : assigneeId;
        }

        if (typeof search === "string" && search.trim()) {
            where.OR = [
                { title: { contains: search.trim(), mode: "insensitive" } },
                { description: { contains: search.trim(), mode: "insensitive" } },
            ];
        }

        const validSortFields = ["createdAt", "updatedAt", "priority", "status", "title"];
        const sortField = typeof sortBy === "string" && validSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sortOrder = order === "asc" ? "asc" : "desc";

        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
        const skip = (pageNum - 1) * limitNum;

        const [total, tasks] = await Promise.all([
            prisma.task.count({ where }),
            prisma.task.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { [sortField]: sortOrder },
                include: {
                    creator: {
                        select: { id: true, name: true, email: true },
                    },
                    assignee: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
        ]);

        return res.status(200).json({
            count: tasks.length,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            tasks,
        });
    } catch (error) {
        console.error("listTasks error:", error);
        return res.status(500).json({ message: "Internal server error listing tasks" });
    }
}

// ----------------------------------------------------
// 3. Get Task (GET /tasks/:taskId)
// ----------------------------------------------------
export async function getTask(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const taskId = getParam(req.params.taskId) || getParam(req.params.id);
    if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
    }

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
                assignee: {
                    select: { id: true, name: true, email: true },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        status: true,
                        organizationId: true,
                        organization: {
                            select: { id: true, name: true, slug: true },
                        },
                    },
                },
            },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Verify caller is a member of the project's parent organization
        const callerOrgMembership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.userId,
                    organizationId: task.project.organizationId,
                },
            },
        });

        if (!callerOrgMembership) {
            return res.status(403).json({
                message: "Access denied. You are not a member of this project's organization.",
            });
        }

        return res.status(200).json({ task });
    } catch (error) {
        console.error("getTask error:", error);
        return res.status(500).json({ message: "Internal server error fetching task" });
    }
}

// ----------------------------------------------------
// 4. Update Task (PATCH /tasks/:taskId)
// ----------------------------------------------------
export async function updateTask(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const taskId = getParam(req.params.taskId) || getParam(req.params.id);
    if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
    }

    const result = UpdateTaskValidation.safeParse(req.body || {});
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { title, description, status, priority, assigneeId } = result.data;

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: {
                    select: { id: true, status: true, organizationId: true },
                },
            },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Verify caller is a member of the project's parent organization
        const callerOrgMembership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.userId,
                    organizationId: task.project.organizationId,
                },
            },
        });

        if (!callerOrgMembership) {
            return res.status(403).json({
                message: "Access denied. You are not a member of this project's organization.",
            });
        }

        if (task.project.status === "ARCHIVED") {
            return res.status(400).json({
                message: "Cannot modify tasks in an archived project.",
            });
        }

        // If assigneeId is provided and not null, verify assignee is in the organization
        if (assigneeId) {
            const assigneeOrgMembership = await prisma.organizationMember.findUnique({
                where: {
                    userId_organizationId: {
                        userId: assigneeId,
                        organizationId: task.project.organizationId,
                    },
                },
            });

            if (!assigneeOrgMembership) {
                return res.status(400).json({
                    message: "The assigned user is not a member of this organization.",
                });
            }
        }

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(title !== undefined ? { title } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(status !== undefined ? { status: status as TaskStatus } : {}),
                ...(priority !== undefined ? { priority: priority as TaskPriority } : {}),
                ...(assigneeId !== undefined ? { assigneeId } : {}),
            },
            include: {
                creator: {
                    select: { id: true, name: true, email: true },
                },
                assignee: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return res.status(200).json({
            message: "Task updated successfully",
            task: updatedTask,
        });
    } catch (error) {
        console.error("updateTask error:", error);
        return res.status(500).json({ message: "Internal server error updating task" });
    }
}

// ----------------------------------------------------
// 5. Delete Task (DELETE /tasks/:taskId)
// ----------------------------------------------------
export async function deleteTask(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const taskId = getParam(req.params.taskId) || getParam(req.params.id);
    if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
    }

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: {
                    select: { id: true, createdBy: true, organizationId: true },
                },
            },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Verify caller is a member of the organization
        const callerOrgMembership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.userId,
                    organizationId: task.project.organizationId,
                },
            },
        });

        if (!callerOrgMembership) {
            return res.status(403).json({ message: "Access denied." });
        }

        // Authorization check:
        // - Organization OWNER or ADMIN
        // - Project creator
        // - Task creator
        // - Project TEAMLEAD
        const isOrgAdminOrOwner = callerOrgMembership.role === "OWNER" || callerOrgMembership.role === "ADMIN";
        const isTaskCreator = task.createdBy === req.user.userId;
        const isProjectCreator = task.project.createdBy === req.user.userId;

        let isProjectTeamLead = false;
        if (!isOrgAdminOrOwner && !isTaskCreator && !isProjectCreator) {
            const projectMembership = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId: task.project.id,
                        userId: req.user.userId,
                    },
                },
            });
            isProjectTeamLead = projectMembership?.role === "TEAMLEAD";
        }

        if (!isOrgAdminOrOwner && !isTaskCreator && !isProjectCreator && !isProjectTeamLead) {
            return res.status(403).json({
                message: "Insufficient permissions. Only the task creator, project teamlead, or organization admin can delete this task.",
            });
        }

        await prisma.task.delete({
            where: { id: taskId },
        });

        return res.status(200).json({
            message: "Task deleted successfully",
        });
    } catch (error) {
        console.error("deleteTask error:", error);
        return res.status(500).json({ message: "Internal server error deleting task" });
    }
}