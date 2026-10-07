import type { User } from "./auth";
import type { PaginationMeta } from "./api";

export type OrganizationRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  logoUrl?: string | null;
  ownerId?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  userRole?: OrganizationRole;
  joinedAt?: string;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    members?: number;
    projects?: number;
  };
}

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  status: InvitationStatus;
  token?: string;
  expiresAt: string;
  createdAt: string;
  invitedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface OrganizationsListResponse extends PaginationMeta {
  organizations: Organization[];
}

export interface MembersListResponse extends PaginationMeta {
  members: OrganizationMember[];
}

export interface InvitationsListResponse extends PaginationMeta {
  invitations: OrganizationInvitation[];
}
