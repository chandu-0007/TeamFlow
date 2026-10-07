"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Users,
} from "lucide-react";
import { useWorkspace } from "../../../context/workspace-context";
import { useAuth } from "../../../context/auth-context";
import { projectsApi } from "../../../lib/api/projects";
import { searchApi } from "../../../lib/api/search";
import { tasksApi } from "../../../lib/api/tasks";
import type { Project } from "../../../types/project";
import type { Task, TaskStatus } from "../../../types/task";
import { Button } from "../../../components/ui/button";
import { IssueRow } from "../../../components/issues/issue-row";
import { IssueDetailDrawer } from "../../../components/issues/issue-detail-drawer";
import { IssueCreateModal } from "../../../components/issues/issue-create-modal";
import { ProjectCreateModal } from "../../../components/projects/project-create-modal";
import { EmptyState } from "../../../components/ui/empty-state";
import { Skeleton } from "../../../components/ui/skeleton";
import { useToast } from "../../../context/toast-context";

export default function WorkspacePage() {
  const { currentOrg, organizations, createOrganization } = useWorkspace();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Drawer state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  // New org creation state for zero-org initial state
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!currentOrg) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [projRes, taskRes] = await Promise.all([
        projectsApi.list(currentOrg.id, { limit: 6 }),
        searchApi.searchTasks({ q: "", organizationId: currentOrg.id, limit: 10 }),
      ]);
      setProjects(projRes.projects || []);
      setTasks(taskRes.tasks || []);
    } catch (err: any) {
      console.error("Failed to load workspace data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle task status update inline
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await tasksApi.update(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: res.task.status } : t))
      );
      if (selectedTask?.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, status: res.task.status } : null));
      }
      toastSuccess("Status updated");
    } catch (err: any) {
      toastError(err.message || "Failed to update status");
    }
  };

  // Zero-org onboarding screen
  if (!currentOrg && organizations.length === 0 && !isLoading) {
    const handleCreateFirstOrg = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newOrgName.trim()) return;
      setIsCreatingOrg(true);
      try {
        await createOrganization({ name: newOrgName.trim() });
        toastSuccess("Workspace created", "Your new workspace is ready");
      } catch (err: any) {
        toastError(err.message || "Failed to create workspace");
      } finally {
        setIsCreatingOrg(false);
      }
    };

    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="bg-surface-subtle border border-surface-border rounded-xl p-8 shadow-modal text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Create your first Workspace
            </h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              Welcome to TeamFlow. Workspaces hold your team’s projects, issues, and member permissions in an isolated multi-tenant environment.
            </p>
          </div>

          <form onSubmit={handleCreateFirstOrg} className="space-y-4 max-w-sm mx-auto">
            <input
              type="text"
              placeholder="e.g. Acme Engineering"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-panel border border-surface-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-500"
              required
              autoFocus
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isCreatingOrg}
            >
              Create Workspace
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Compute metrics
  const totalTasks = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const activeProjectsCount = projects.filter((p) => p.status === "ACTIVE").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 select-none">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              {currentOrg?.name || "Workspace"}
            </h1>
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-surface-panel border border-surface-border text-text-tertiary">
              {currentOrg?.slug || "org"}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Engineering overview for {user?.name || "your team"}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCreateProjectOpen(true)}
            className="flex items-center gap-1.5"
          >
            <FolderKanban className="w-3.5 h-3.5 text-text-tertiary" />
            <span>New Project</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateIssueOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Issue</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between">
          <div>
            <span className="text-2xs font-medium text-text-tertiary uppercase tracking-wider block">
              Active Projects
            </span>
            <span className="text-2xl font-bold text-text-primary mt-1 block">
              {isLoading ? <Skeleton className="h-8 w-12" /> : activeProjectsCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 text-white flex items-center justify-center">
            <FolderKanban className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between">
          <div>
            <span className="text-2xs font-medium text-text-tertiary uppercase tracking-wider block">
              Total Issues
            </span>
            <span className="text-2xl font-bold text-text-primary mt-1 block">
              {isLoading ? <Skeleton className="h-8 w-12" /> : totalTasks}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-surface-panel border border-surface-border text-text-secondary flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between">
          <div>
            <span className="text-2xs font-medium text-text-tertiary uppercase tracking-wider block">
              In Progress
            </span>
            <span className="text-2xl font-bold text-amber-400 mt-1 block">
              {isLoading ? <Skeleton className="h-8 w-12" /> : inProgressCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between">
          <div>
            <span className="text-2xs font-medium text-text-tertiary uppercase tracking-wider block">
              Completed
            </span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">
              {isLoading ? <Skeleton className="h-8 w-12" /> : doneCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Issues */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-text-primary">
                Recent Issues
              </h2>
              <span className="text-2xs font-mono text-text-tertiary bg-surface-panel px-1.5 py-0.5 rounded border border-surface-border">
                {tasks.length}
              </span>
            </div>
            <Link
              href="/issues"
              className="text-xs text-text-secondary hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-surface-subtle border border-surface-border rounded-lg overflow-hidden divide-y divide-surface-border">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : tasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-6 h-6 text-text-tertiary" />}
                title="No issues found"
                description="There are currently no tasks in this workspace. Create your first issue to track work."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateIssueOpen(true)}
                  >
                    Create Issue
                  </Button>
                }
              />
            ) : (
              tasks.map((task) => (
                <IssueRow
                  key={task.id}
                  task={task}
                  onClick={(t) => {
                    setSelectedTask(t);
                    setIsDrawerOpen(true);
                  }}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column (1 col): Active Projects */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">
              Active Projects
            </h2>
            <Link
              href="/projects"
              className="text-xs text-text-secondary hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>All projects</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : projects.length === 0 ? (
              <div className="p-6 rounded-lg bg-surface-subtle border border-surface-border text-center space-y-3">
                <FolderKanban className="w-6 h-6 text-text-tertiary mx-auto" />
                <p className="text-xs text-text-secondary">
                  No projects created yet. Projects group your issues into milestones.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateProjectOpen(true)}
                >
                  Create Project
                </Button>
              </div>
            ) : (
              projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-3.5 rounded-lg bg-surface-subtle hover:bg-surface-panel border border-surface-border transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-text-primary group-hover:text-white transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-2xs text-text-tertiary line-clamp-1 mt-0.5">
                        {project.description || "No description"}
                      </p>
                    </div>
                    <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-surface-panel text-text-tertiary border border-surface-border">
                      {project.slug}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-2 border-t border-surface-border/60 text-2xs text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <FolderKanban className="w-3 h-3" />
                      <span>{project._count?.tasks || 0} issues</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{project._count?.projectMembers || 1} members</span>
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Drawer */}
      <IssueDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        task={selectedTask}
        onTaskUpdated={(updatedTask: Task) => {
          setSelectedTask(updatedTask);
          setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
        }}
        onTaskDeleted={(deletedId: string) => {
          setIsDrawerOpen(false);
          setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          toastSuccess("Issue deleted");
        }}
      />

      {/* Issue Creation Modal */}
      {currentOrg && (
        <IssueCreateModal
          isOpen={isCreateIssueOpen}
          onClose={() => setIsCreateIssueOpen(false)}
          organizationId={currentOrg.id}
          onSuccess={() => {
            loadDashboardData();
          }}
        />
      )}

      {/* Project Creation Modal */}
      {currentOrg && (
        <ProjectCreateModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          organizationId={currentOrg.id}
          onSuccess={() => {
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
