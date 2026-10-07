import { apiClient } from "./client";
import type { GlobalSearchResponse } from "../../types/search";
import type { ProjectsListResponse } from "../../types/project";
import type { TasksListResponse } from "../../types/task";

export interface GlobalSearchParams {
  q: string;
  organizationId?: string;
  type?: "all" | "organizations" | "projects" | "tasks" | "members";
  limit?: number;
}

export const searchApi = {
  globalSearch: async (params: GlobalSearchParams): Promise<GlobalSearchResponse> => {
    return apiClient<GlobalSearchResponse>("/api/search", {
      method: "GET",
      params: params as unknown as Record<string, string | number | boolean | null | undefined>,
    });
  },

  searchProjects: async (params: { q: string; organizationId?: string; status?: string; page?: number; limit?: number }): Promise<ProjectsListResponse> => {
    return apiClient<ProjectsListResponse>("/api/search/projects", {
      method: "GET",
      params,
    });
  },

  searchTasks: async (params: { q: string; organizationId?: string; projectId?: string; status?: string; priority?: string; page?: number; limit?: number }): Promise<TasksListResponse> => {
    return apiClient<TasksListResponse>("/api/search/tasks", {
      method: "GET",
      params,
    });
  },
};
