import type { PaginationMeta } from "./api";

export type ProjectRole = "TEAMLEAD" | "MEMBER";
export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: ProjectStatus;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  projectMembers?: ProjectMember[];
  userProjectRole?: ProjectRole | null;
  _count?: {
    projectMembers?: number;
    tasks?: number;
  };
}

export interface ProjectsListResponse extends PaginationMeta {
  projects: Project[];
}

export interface ProjectMembersListResponse extends PaginationMeta {
  members: ProjectMember[];
}
