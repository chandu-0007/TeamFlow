import type { PaginationMeta } from "./api";

export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Alias Issue to Task for Linear UX alignment
export type IssueStatus = TaskStatus;
export type IssuePriority = TaskPriority;

export interface TaskUser {
  id: string;
  name: string;
  email: string;
}

export interface TaskProject {
  id: string;
  name: string;
  slug: string;
  organizationId?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  createdBy: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: TaskProject;
  creator?: TaskUser;
  assignee?: TaskUser | null;
}

// Issue alias for UI layer
export type Issue = Task;

export interface TasksListResponse extends PaginationMeta {
  tasks: Task[];
}
