"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckSquare,
  Users,
  Settings,
  Plus,
  Archive,
  Trash2,
  Calendar,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { projectsApi, type UpdateProjectDto } from "../../../../lib/api/projects";
import { tasksApi } from "../../../../lib/api/tasks";
import type { Project, ProjectMember, ProjectRole } from "../../../../types/project";
import type { Task, TaskStatus } from "../../../../types/task";
import { Tabs } from "../../../../components/ui/tabs";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { Badge } from "../../../../components/ui/badge";
import { Avatar } from "../../../../components/ui/avatar";
import { IssueRow } from "../../../../components/issues/issue-row";
import { IssueDetailDrawer } from "../../../../components/issues/issue-detail-drawer";
import { IssueCreateModal } from "../../../../components/issues/issue-create-modal";
import { EmptyState } from "../../../../components/ui/empty-state";
import { Skeleton } from "../../../../components/ui/skeleton";
import { useToast } from "../../../../context/toast-context";
import { formatDate } from "../../../../lib/utils/format";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { success: toastSuccess, error: toastError } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [activeTab, setActiveTab] = useState("tasks");
  const [isLoading, setIsLoading] = useState(true);

  // Task Drawer & Create modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Add member state
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>("MEMBER");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Settings form state
  const [settingsName, setSettingsName] = useState("");
  const [settingsSlug, setSettingsSlug] = useState("");
  const [settingsDesc, setSettingsDesc] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const [projRes, tasksRes, membersRes] = await Promise.all([
        projectsApi.get(projectId),
        tasksApi.list(projectId),
        projectsApi.listMembers(projectId),
      ]);

      setProject(projRes.project);
      setSettingsName(projRes.project.name);
      setSettingsSlug(projRes.project.slug);
      setSettingsDesc(projRes.project.description || "");

      setTasks(tasksRes.tasks || []);
      setMembers(membersRes.members || []);
    } catch (err: any) {
      console.error("Failed to load project details:", err);
      toastError(err.message || "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, toastError]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Handle task status update
  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
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

  // Add Member to Project
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setIsAddingMember(true);
    try {
      const res = await projectsApi.addMember(projectId, newMemberEmail.trim(), newMemberRole);
      setMembers((prev) => [...prev, res.member]);
      setNewMemberEmail("");
      toastSuccess("Member added to project");
    } catch (err: any) {
      toastError(err.message || "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove Member from Project
  const handleRemoveMember = async (memberId: string) => {
    try {
      await projectsApi.removeMember(projectId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toastSuccess("Member removed");
    } catch (err: any) {
      toastError(err.message || "Failed to remove member");
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const payload: UpdateProjectDto = {
        name: settingsName.trim(),
        slug: settingsSlug.trim() || undefined,
        description: settingsDesc.trim() || undefined,
      };
      const res = await projectsApi.update(projectId, payload);
      setProject(res.project);
      toastSuccess("Project updated");
    } catch (err: any) {
      toastError(err.message || "Failed to update project settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Archive Project
  const handleArchiveProject = async () => {
    try {
      const res = await projectsApi.archive(projectId);
      setProject(res.project);
      toastSuccess("Project archived");
    } catch (err: any) {
      toastError(err.message || "Failed to archive project");
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this project? This cannot be undone.")) {
      return;
    }
    try {
      await projectsApi.delete(projectId);
      toastSuccess("Project deleted");
      router.push("/projects");
    } catch (err: any) {
      toastError(err.message || "Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-text-primary">Project Not Found</h2>
        <p className="text-xs text-text-secondary">
          The requested project does not exist or has been removed.
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-white hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  const tabsConfig = [
    {
      id: "tasks",
      label: "Tasks",
      count: tasks.length,
      icon: <CheckSquare className="w-3.5 h-3.5" />,
    },
    {
      id: "members",
      label: "Members",
      count: members.length,
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none">
      {/* Top back link */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              {project.name}
            </h1>
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-surface-panel border border-surface-border text-text-tertiary">
              {project.slug}
            </span>
            {project.status === "ARCHIVED" ? (
              <Badge variant="warning" size="xs">
                Archived
              </Badge>
            ) : (
              <Badge variant="brand" size="xs">
                Active
              </Badge>
            )}
          </div>

          <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
            {project.description || "No project description provided."}
          </p>

          <div className="flex items-center gap-4 pt-1 text-2xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Created {formatDate(project.createdAt)}</span>
            </span>
            {project.creator && (
              <span>Created by {project.creator.name || project.creator.email}</span>
            )}
          </div>
        </div>

        {activeTab === "tasks" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />

      {/* TAB: Tasks */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="bg-surface-subtle border border-surface-border rounded-lg overflow-hidden divide-y divide-surface-border">
            {tasks.length === 0 ? (
              <EmptyState
                icon={<CheckSquare className="w-6 h-6 text-text-tertiary" />}
                title="No tasks in this project"
                description="Keep your project organized by adding its first task."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateTaskOpen(true)}
                  >
                    Add Task
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
                  onStatusChange={handleTaskStatusChange}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: Members */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Add member box */}
          <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border">
            <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-white" />
              <span>Add Member to Project</span>
            </h3>
            <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <input
                type="email"
                placeholder="colleague@company.com or user ID"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-md bg-surface-panel border border-surface-border text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-500"
                required
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as ProjectRole)}
                className="px-2.5 py-1.5 rounded-md bg-surface-panel border border-surface-border text-xs text-text-secondary focus:outline-none focus:border-brand-500"
              >
                <option value="MEMBER">Member</option>
                <option value="TEAMLEAD">Team Lead</option>
              </select>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isAddingMember}
              >
                Add
              </Button>
            </form>
          </div>

          {/* Members list */}
          <div className="bg-surface-subtle border border-surface-border rounded-lg divide-y divide-surface-border overflow-hidden">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-3.5 flex items-center justify-between hover:bg-surface-hover/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={m.user?.name} email={m.user?.email} size="sm" />
                  <div>
                    <span className="text-xs font-medium text-text-primary block">
                      {m.user?.name || "Member"}
                    </span>
                    <span className="text-2xs text-text-tertiary block">
                      {m.user?.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={m.role === "TEAMLEAD" ? "brand" : "default"} size="xs">
                    {m.role}
                  </Badge>

                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="p-1 rounded text-text-tertiary hover:text-red-400 hover:bg-surface-hover transition-colors"
                    title="Remove from project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Settings */}
      {activeTab === "settings" && (
        <div className="space-y-6 max-w-2xl">
          <form onSubmit={handleSaveSettings} className="p-5 rounded-lg bg-surface-subtle border border-surface-border space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">General Settings</h3>

            <Input
              label="Project Name"
              value={settingsName}
              onChange={(e) => setSettingsName(e.target.value)}
              required
            />

            <Input
              label="Project Key / Slug"
              value={settingsSlug}
              onChange={(e) => setSettingsSlug(e.target.value)}
              helperText="Used as issue identifier prefix (e.g. CORE-123)"
              required
            />

            <Textarea
              label="Description"
              value={settingsDesc}
              onChange={(e) => setSettingsDesc(e.target.value)}
              rows={3}
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingSettings}
            >
              Save Changes
            </Button>
          </form>

          {/* Danger zone */}
          <div className="p-5 rounded-lg bg-surface-subtle border border-red-500/20 space-y-4">
            <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>

            <div className="flex items-center justify-between pt-2 border-t border-surface-border">
              <div>
                <span className="text-xs font-medium text-text-primary block">
                  {project.status === "ARCHIVED" ? "Unarchive Project" : "Archive Project"}
                </span>
                <span className="text-2xs text-text-tertiary block">
                  Mark this project as read-only.
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleArchiveProject}
                className="flex items-center gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{project.status === "ARCHIVED" ? "Unarchive" : "Archive"}</span>
              </Button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-surface-border">
              <div>
                <span className="text-xs font-medium text-red-400 block">
                  Delete Project
                </span>
                <span className="text-2xs text-text-tertiary block">
                  Permanently delete this project and all associated tasks.
                </span>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteProject}
                className="flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Drawer */}
      <IssueDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        task={selectedTask}
        onTaskUpdated={(updated: Task) => {
          setSelectedTask(updated);
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }}
        onTaskDeleted={(deletedId: string) => {
          setIsDrawerOpen(false);
          setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          toastSuccess("Task deleted");
        }}
      />

      {/* Issue Create Modal (defaulted to this project) */}
      {project && (
        <IssueCreateModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          organizationId={project.organizationId}
          defaultProjectId={project.id}
          onSuccess={() => {
            fetchProjectData();
          }}
        />
      )}
    </div>
  );
}
