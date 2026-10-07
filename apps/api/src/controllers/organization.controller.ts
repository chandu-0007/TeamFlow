import type { Request, Response } from "express";
import z from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";
import {
    prisma,
    type OrganizationRole,
    type InvitationStatus,
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

function getTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
}

async function sendInvitationEmail(
    email: string,
    orgName: string,
    inviterName: string,
    role: string,
    token: string
) {
    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || "TeamFlow <noreply@teamflow.dev>",
            to: email,
            subject: `You've been invited to join ${orgName} on TeamFlow`,
            html: `
                <h2>Join ${orgName} on TeamFlow</h2>
                <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>${role}</strong>.</p>
                <p>Invitation Token:</p>
                <code style="display:inline-block; padding:8px 12px; background:#f4f4f5; border-radius:4px; font-weight:bold;">${token}</code>
                <p>This invitation will expire in 7 days.</p>
            `,
        });
        console.log(`[ORG] Invitation email sent to ${email}`);
    } catch (err: any) {
        console.warn(`[ORG] SMTP delivery failed (${err.message}). Logging invitation details for development:`);
        console.log(`\n==================================================`);
        console.log(`✉️  ORGANIZATION INVITATION for ${email}`);
        console.log(`Organization: ${orgName} | Role: ${role}`);
        console.log(`Invitation Token: [ ${token} ]`);
        console.log(`Accept Endpoint: POST /api/organizations/invitations/accept { "token": "${token}" }`);
        console.log(`==================================================\n`);
    }
}

// ----------------------------------------------------
// Validation Schemas
// ----------------------------------------------------
const CreateOrganizationValidation = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens").optional(),
    description: z.string().max(500).optional(),
    websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal("")),
    linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
    logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
});

const UpdateOrganizationValidation = z.object({
    name: z.string().min(2).max(50).optional(),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().max(500).optional().nullable(),
    websiteUrl: z.string().url().optional().nullable().or(z.literal("")),
    linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
    logoUrl: z.string().url().optional().nullable().or(z.literal("")),
});

const InviteMemberValidation = z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"] as const).default("MEMBER"),
});

const AcceptInvitationValidation = z.object({
    token: z.string().min(1, "Invitation token is required"),
});

const ChangeRoleValidation = z.object({
    role: z.enum(["ADMIN", "MANAGER", "MEMBER", "VIEWER"] as const),
});

export async function createOrganization(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const result = CreateOrganizationValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { name, description, websiteUrl, linkedinUrl, logoUrl } = result.data;
    let baseSlug = result.data.slug ? slugify(result.data.slug) : slugify(name);
    if (!baseSlug) baseSlug = "org";

    try {
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.organization.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}-${crypto.randomBytes(2).toString("hex")}`;
            counter++;
        }

        const organization = await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name,
                    slug,
                    description: description || null,
                    websiteUrl: websiteUrl || null,
                    linkedinUrl: linkedinUrl || null,
                    logoUrl: logoUrl || null,
                    ownerId: req.user!.userId,
                },
            });

            await tx.organizationMember.create({
                data: {
                    userId: req.user!.userId,
                    organizationId: org.id,
                    role: "OWNER",
                },
            });

            return org;
        });

        return res.status(201).json({
            message: "Organization created successfully",
            organization,
        });
    } catch (error) {
        console.error("createOrganization error:", error);
        return res.status(500).json({ message: "Internal server error creating organization" });
    }
}

// ----------------------------------------------------
// 2. List User's Organizations
// ----------------------------------------------------
export async function listUserOrganizations(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const { search, role, sortBy: querySortBy, order: queryOrder, page: queryPage, limit: queryLimit } = req.query;

        const where: Prisma.OrganizationMemberWhereInput = {
            userId: req.user.userId,
        };

        if (typeof role === "string" && ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"].includes(role)) {
            where.role = role as OrganizationRole;
        }

        if (typeof search === "string" && search.trim()) {
            const trimmed = search.trim();
            where.organization = {
                OR: [
                    { name: { contains: trimmed, mode: "insensitive" } },
                    { slug: { contains: trimmed, mode: "insensitive" } },
                    { description: { contains: trimmed, mode: "insensitive" } },
                ],
            };
        }

        const { page, limit, skip, take } = parsePagination(queryPage, queryLimit, 20);
        const { sortBy, order } = parseSorting(
            querySortBy,
            queryOrder,
            ["createdAt", "name"] as const,
            "createdAt",
            "desc"
        );

        const orderBy: Prisma.OrganizationMemberOrderByWithRelationInput =
            sortBy === "name"
                ? { organization: { name: order } }
                : { createdAt: order };

        const [total, memberships] = await Promise.all([
            prisma.organizationMember.count({ where }),
            prisma.organizationMember.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    organization: {
                        include: {
                            owner: {
                                select: { id: true, name: true, email: true },
                            },
                            _count: {
                                select: { members: true, projects: true },
                            },
                        },
                    },
                },
            }),
        ]);

        const organizations = memberships.map((m) => ({
            ...m.organization,
            userRole: m.role,
            joinedAt: m.createdAt,
        }));

        return res.status(200).json({
            ...buildPaginationMeta(total, page, limit, organizations.length),
            organizations,
        });
    } catch (error) {
        console.error("listUserOrganizations error:", error);
        return res.status(500).json({ message: "Internal server error fetching organizations" });
    }
}


export async function getOrganization(req: Request, res: Response) {
    const organizationId = getParam(req.params.id) || getParam(req.params.organizationId);

    try {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: {
                owner: {
                    select: { id: true, name: true, email: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
                _count: {
                    select: { members: true },
                },
            },
        });

        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        return res.status(200).json({
            organization,
            userRole: req.membership?.role,
        });
    } catch (error) {
        console.error("getOrganization error:", error);
        return res.status(500).json({ message: "Internal server error fetching organization details" });
    }
}


export async function updateOrganization(req: Request, res: Response) {
    const organizationId = getParam(req.params.id) || getParam(req.params.organizationId);

    const result = UpdateOrganizationValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    try {
        const data: any = { ...result.data };

        if (data.slug) {
            const existingSlug = await prisma.organization.findFirst({
                where: {
                    slug: data.slug,
                    NOT: { id: organizationId },
                },
            });
            if (existingSlug) {
                return res.status(409).json({ message: "This slug is already taken" });
            }
        }

        const organization = await prisma.organization.update({
            where: { id: organizationId },
            data,
        });

        return res.status(200).json({
            message: "Organization updated successfully",
            organization,
        });
    } catch (error) {
        console.error("updateOrganization error:", error);
        return res.status(500).json({ message: "Internal server error updating organization" });
    }
}

// ----------------------------------------------------
// 5. Delete Organization
// ----------------------------------------------------
export async function deleteOrganization(req: Request, res: Response) {
    const organizationId = getParam(req.params.id) || getParam(req.params.organizationId);

    try {
        await prisma.organization.delete({
            where: { id: organizationId },
        });

        return res.status(200).json({
            message: "Organization deleted successfully",
        });
    } catch (error) {
        console.error("deleteOrganization error:", error);
        return res.status(500).json({ message: "Internal server error deleting organization" });
    }
}

// ----------------------------------------------------
// 6. Invite Member
// ----------------------------------------------------
export async function inviteMember(req: Request, res: Response) {
    const organizationId = getParam(req.params.id) || getParam(req.params.organizationId);

    const result = InviteMemberValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { role } = result.data;
    const email = result.data.email.trim().toLowerCase();

    // Permissions check on role delegation
    const inviterRole = req.membership?.role;
    if (inviterRole === "MANAGER" && (role === "ADMIN" || role === "MANAGER")) {
        return res.status(403).json({
            message: "Managers can only invite members with 'MEMBER' or 'VIEWER' role",
        });
    }

    try {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { id: true, name: true },
        });

        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Check if user is already a member
        const existingMember = await prisma.organizationMember.findFirst({
            where: {
                organizationId,
                user: { email },
            },
        });

        if (existingMember) {
            return res.status(400).json({
                message: "User is already a member of this organization",
            });
        }

        // Check active pending invitations
        const existingInvitation = await prisma.organizationInvitation.findFirst({
            where: {
                organizationId,
                email,
                status: "PENDING",
                expiresAt: { gt: new Date() },
            },
        });

        if (existingInvitation) {
            return res.status(409).json({
                message: "An active invitation has already been sent to this email address",
                invitationId: existingInvitation.id,
            });
        }

        const inviter = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: { name: true },
        });

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invitation = await prisma.organizationInvitation.create({
            data: {
                organizationId,
                email,
                role: role as OrganizationRole,
                token,
                invitedById: req.user!.userId,
                expiresAt,
            },
        });

        await sendInvitationEmail(
            email,
            organization.name,
            inviter?.name || "A team member",
            role,
            token
        );

        return res.status(201).json({
            message: "Invitation sent successfully",
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                token: invitation.token,
                expiresAt: invitation.expiresAt,
            },
        });
    } catch (error) {
        console.error("inviteMember error:", error);
        return res.status(500).json({ message: "Internal server error sending invitation" });
    }
}

export async function acceptInvitation(req: Request, res: Response) {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Authentication required to accept an invitation" });
    }

    const result = AcceptInvitationValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { token } = result.data;

    try {
        const invitation = await prisma.organizationInvitation.findUnique({
            where: { token },
            include: { organization: true },
        });

        if (!invitation) {
            return res.status(404).json({ message: "Invalid invitation token" });
        }

        if (invitation.status !== "PENDING") {
            return res.status(400).json({
                message: `This invitation has already been ${invitation.status.toLowerCase()}`,
            });
        }

        if (new Date() > invitation.expiresAt) {
            await prisma.organizationInvitation.update({
                where: { id: invitation.id },
                data: { status: "EXPIRED" },
            });
            return res.status(400).json({ message: "This invitation has expired" });
        }

        // Check if already a member
        const existingMember = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: req.user.userId,
                    organizationId: invitation.organizationId,
                },
            },
        });

        if (existingMember) {
            await prisma.organizationInvitation.update({
                where: { id: invitation.id },
                data: { status: "ACCEPTED" },
            });
            return res.status(200).json({
                message: "You are already a member of this organization",
                organization: invitation.organization,
                role: existingMember.role,
            });
        }

        const membership = await prisma.$transaction(async (tx) => {
            const member = await tx.organizationMember.create({
                data: {
                    userId: req.user!.userId,
                    organizationId: invitation.organizationId,
                    role: invitation.role,
                },
            });

            await tx.organizationInvitation.update({
                where: { id: invitation.id },
                data: { status: "ACCEPTED" },
            });

            return member;
        });

        return res.status(200).json({
            message: `Successfully joined ${invitation.organization.name}`,
            organization: invitation.organization,
            role: membership.role,
        });
    } catch (error) {
        console.error("acceptInvitation error:", error);
        return res.status(500).json({ message: "Internal server error accepting invitation" });
    }
}

export async function removeMember(req: Request, res: Response) {
    const organizationId = getParam(req.params.id) || getParam(req.params.organizationId);
    const memberId = getParam(req.params.memberId);

    try {
        const targetMember = await prisma.organizationMember.findFirst({
            where: {
                organizationId,
                OR: [{ id: memberId }, { userId: memberId }],
            },
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        if (!targetMember) {
            return res.status(404).json({ message: "Member not found in this organization" });
        }

        if (targetMember.role === "OWNER") {
            return res.status(400).json({ message: "The organization owner cannot be removed" });
        }

        const requesterRole = req.membership?.role;

        // Admins cannot remove other Admins
        if (requesterRole === "ADMIN" && targetMember.role === "ADMIN") {
            return res.status(403).json({
                message: "Admins cannot remove other Admins",
            });
        }

        await prisma.organizationMember.delete({
            where: { id: targetMember.id },
        });

        return res.status(200).json({
            message: `Member ${targetMember.user.name} removed from organization successfully`,
        });
    } catch (error) {
        console.error("removeMember error:", error);
        return res.status(500).json({ message: "Internal server error removing member" });
    }
}


export async function changeMemberRole(req: Request, res: Response) {
    const organizationId = getParam(req.params.id) || getParam(req.params.organizationId);
    const memberId = getParam(req.params.memberId);

    const result = ChangeRoleValidation.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input",
            errors: result.error.flatten(),
        });
    }

    const { role: newRole } = result.data;

    try {
        const targetMember = await prisma.organizationMember.findFirst({
            where: {
                organizationId,
                OR: [{ id: memberId }, { userId: memberId }],
            },
        });

        if (!targetMember) {
            return res.status(404).json({ message: "Member not found in this organization" });
        }

        if (targetMember.role === "OWNER") {
            return res.status(400).json({ message: "Cannot change the role of the organization owner" });
        }

        const requesterRole = req.membership?.role;

        if (requesterRole === "ADMIN") {
            if (targetMember.role === "ADMIN") {
                return res.status(403).json({ message: "Admins cannot change the role of other Admins" });
            }
            if (newRole === "ADMIN") {
                return res.status(403).json({ message: "Only the Owner can promote a member to Admin" });
            }
        }

        const updatedMember = await prisma.organizationMember.update({
            where: { id: targetMember.id },
            data: { role: newRole as OrganizationRole },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return res.status(200).json({
            message: "Member role updated successfully",
            member: updatedMember,
        });
    } catch (error) {
        console.error("changeMemberRole error:", error);
        return res.status(500).json({ message: "Internal server error updating member role" });
    }
}

// ----------------------------------------------------
// 10. Leave Organization
// ----------------------------------------------------
export async function leaveOrganization(req: Request, res: Response) {
    const organizationId = getParam(req.params.id) || getParam(req.params.organizationId);
    const userId = req.user!.userId;

    try {
        const membership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
        });

        if (!membership) {
            return res.status(404).json({ message: "You are not a member of this organization" });
        }

        if (membership.role === "OWNER") {
            return res.status(400).json({
                message: "As the owner, you cannot leave the organization. Please transfer ownership or delete the organization.",
            });
        }

        await prisma.organizationMember.delete({
            where: { id: membership.id },
        });

        return res.status(200).json({
            message: "You have left the organization successfully",
        });
    } catch (error) {
        console.error("leaveOrganization error:", error);
        return res.status(500).json({ message: "Internal server error leaving organization" });
    }
}

// ----------------------------------------------------
// 11. List Members
// ----------------------------------------------------
export async function listMembers(req: Request, res: Response) {
    const organizationId = getParam(req.params.id) || getParam(req.params.organizationId);

    try {
        const { search, role, sortBy: querySortBy, order: queryOrder, page: queryPage, limit: queryLimit } = req.query;

        const where: Prisma.OrganizationMemberWhereInput = {
            organizationId,
        };

        if (typeof role === "string" && ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"].includes(role)) {
            where.role = role as OrganizationRole;
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

        let orderBy: Prisma.OrganizationMemberOrderByWithRelationInput;
        if (sortBy === "name" || sortBy === "email") {
            orderBy = { user: { [sortBy]: order } };
        } else {
            orderBy = { [sortBy]: order };
        }

        const [total, members] = await Promise.all([
            prisma.organizationMember.count({ where }),
            prisma.organizationMember.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
        ]);

        return res.status(200).json({
            ...buildPaginationMeta(total, page, limit, members.length),
            members,
        });
    } catch (error) {
        console.error("listMembers error:", error);
        return res.status(500).json({ message: "Internal server error listing members" });
    }
}

// ----------------------------------------------------
// 12. List Invitations
// ----------------------------------------------------
export async function listInvitations(req: Request, res: Response) {
    const organizationId = getParam(req.params.id) || getParam(req.params.organizationId);

    try {
        const { search, status, role, sortBy: querySortBy, order: queryOrder, page: queryPage, limit: queryLimit } = req.query;

        const where: Prisma.OrganizationInvitationWhereInput = {
            organizationId,
        };

        if (typeof status === "string" && ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"].includes(status)) {
            where.status = status as InvitationStatus;
        }

        if (typeof role === "string" && ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"].includes(role)) {
            where.role = role as OrganizationRole;
        }

        if (typeof search === "string" && search.trim()) {
            where.email = { contains: search.trim(), mode: "insensitive" };
        }

        const { page, limit, skip, take } = parsePagination(queryPage, queryLimit, 20);
        const { sortBy, order } = parseSorting(
            querySortBy,
            queryOrder,
            ["createdAt", "expiresAt", "email", "status", "role"] as const,
            "createdAt",
            "desc"
        );

        const orderBy: Prisma.OrganizationInvitationOrderByWithRelationInput = {
            [sortBy]: order,
        };

        const [total, invitations] = await Promise.all([
            prisma.organizationInvitation.count({ where }),
            prisma.organizationInvitation.findMany({
                where,
                skip,
                take,
                orderBy,
                include: {
                    invitedBy: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
        ]);

        return res.status(200).json({
            ...buildPaginationMeta(total, page, limit, invitations.length),
            invitations,
        });
    } catch (error) {
        console.error("listInvitations error:", error);
        return res.status(500).json({ message: "Internal server error listing invitations" });
    }
}
