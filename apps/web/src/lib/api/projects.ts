import { apiClient } from "./client";
import type {
  Project,
  ProjectsListResponse,
  ProjectMembersListResponse,
  ProjectMember,
  ProjectRole,
  ProjectStatus,
} from "../../types/project";

export interface CreateProjectDto {
  organizationId: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  slug?: string;
  description?: string;
}

export const projectsApi = {
  list: async (organizationId: string, params?: { search?: string; status?: ProjectStatus; sortBy?: string; order?: string; page?: number; limit?: number }): Promise<ProjectsListResponse> => {
    return apiClient<ProjectsListResponse>("/api/projects", {
      method: "GET",
      params: {
        organizationId,
        ...params,
      },
    });
  },

  get: async (id: string): Promise<{ project: Project; userProjectRole?: ProjectRole | null }> => {
    return apiClient<{ project: Project; userProjectRole?: ProjectRole | null }>(`/api/projects/${id}`, {
      method: "GET",
    });
  },

  create: async (data: CreateProjectDto): Promise<{ message: string; project: Project }> => {
    return apiClient<{ message: string; project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateProjectDto): Promise<{ message: string; project: Project }> => {
    return apiClient<{ message: string; project: Project }>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  archive: async (id: string): Promise<{ message: string; project: Project }> => {
    return apiClient<{ message: string; project: Project }>(`/api/projects/${id}/archive`, {
      method: "PATCH",
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/api/projects/${id}`, {
      method: "DELETE",
    });
  },

  listMembers: async (id: string, params?: { search?: string; role?: ProjectRole; sortBy?: string; order?: string; page?: number; limit?: number }): Promise<ProjectMembersListResponse> => {
    return apiClient<ProjectMembersListResponse>(`/api/projects/${id}/members`, {
      method: "GET",
      params,
    });
  },

  addMember: async (id: string, emailOrUserId: string, role: ProjectRole = "MEMBER"): Promise<{ message: string; member: ProjectMember }> => {
    return apiClient<{ message: string; member: ProjectMember }>(`/api/projects/${id}/members`, {
      method: "POST",
      body: JSON.stringify({ emailOrUserId, role }),
    });
  },

  changeMemberRole: async (id: string, memberId: string, role: ProjectRole): Promise<{ message: string; member: ProjectMember }> => {
    return apiClient<{ message: string; member: ProjectMember }>(`/api/projects/${id}/members/${memberId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  removeMember: async (id: string, memberId: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/api/projects/${id}/members/${memberId}`, {
      method: "DELETE",
    });
  },
};
