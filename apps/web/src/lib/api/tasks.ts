import { apiClient } from "./client";
import type { Task, TasksListResponse, TaskStatus, TaskPriority } from "../../types/task";

export interface CreateTaskDto {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
}

export interface ListTasksParams {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export const tasksApi = {
  list: async (projectId: string, params?: ListTasksParams): Promise<TasksListResponse> => {
    return apiClient<TasksListResponse>(`/api/projects/${projectId}/tasks`, {
      method: "GET",
      params: params as Record<string, string | number | boolean | null | undefined>,
    });
  },

  get: async (taskId: string): Promise<{ task: Task }> => {
    return apiClient<{ task: Task }>(`/api/tasks/${taskId}`, {
      method: "GET",
    });
  },

  create: async (projectId: string, data: CreateTaskDto): Promise<{ message: string; task: Task }> => {
    return apiClient<{ message: string; task: Task }>(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (taskId: string, data: UpdateTaskDto): Promise<{ message: string; task: Task }> => {
    return apiClient<{ message: string; task: Task }>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (taskId: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });
  },
};
