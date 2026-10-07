"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, CheckSquare } from "lucide-react";
import { useWorkspace } from "../../../context/workspace-context";
import { searchApi } from "../../../lib/api/search";
import { tasksApi } from "../../../lib/api/tasks";
import type { Task, TaskStatus, TaskPriority } from "../../../types/task";
import { IssueRow } from "../../../components/issues/issue-row";
import { IssueFilters } from "../../../components/issues/issue-filters";
import { IssueDetailDrawer } from "../../../components/issues/issue-detail-drawer";
import { IssueCreateModal } from "../../../components/issues/issue-create-modal";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";
import { Skeleton } from "../../../components/ui/skeleton";
import { useToast } from "../../../context/toast-context";

export default function IssuesPage() {
  const { currentOrg } = useWorkspace();
  const { success: toastSuccess, error: toastError } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">("ALL");

  // Drawer & Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchIssues = useCallback(async () => {
    if (!currentOrg) return;

    setIsLoading(true);
    try {
      const res = await searchApi.searchTasks({
        q: search.trim(),
        organizationId: currentOrg.id,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        priority: priorityFilter === "ALL" ? undefined : priorityFilter,
        limit: 50,
      });
      setTasks(res.tasks || []);
      setTotalCount(res.total ?? (res.tasks?.length || 0));
    } catch (err: any) {
      console.error("Failed to load issues:", err);
      toastError(err.message || "Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, search, statusFilter, priorityFilter, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIssues();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchIssues]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              All Issues
            </h1>
            <span className="text-2xs font-mono text-text-tertiary bg-surface-panel px-2 py-0.5 rounded border border-surface-border">
              {totalCount}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Track, prioritize, and manage tasks across your workspace projects.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Issue</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <IssueFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        totalCount={totalCount}
      />

      {/* Issues Table Container */}
      <div className="bg-surface-subtle border border-surface-border rounded-lg overflow-hidden divide-y divide-surface-border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-6 h-6 text-text-tertiary" />}
            title={search || statusFilter !== "ALL" || priorityFilter !== "ALL" ? "No matching issues" : "No issues yet"}
            description={
              search || statusFilter !== "ALL" || priorityFilter !== "ALL"
                ? "Try clearing filters or search terms to find what you're looking for."
                : "Create your first issue in this workspace to track engineering work."
            }
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
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

      {/* Issue Detail Drawer */}
      <IssueDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        task={selectedTask}
        onTaskUpdated={(updated) => {
          setSelectedTask(updated);
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }}
        onTaskDeleted={(deletedId) => {
          setIsDrawerOpen(false);
          setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          setTotalCount((c) => Math.max(0, c - 1));
          toastSuccess("Issue deleted");
        }}
      />

      {/* Issue Create Modal */}
      {currentOrg && (
        <IssueCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          organizationId={currentOrg.id}
          onSuccess={() => {
            fetchIssues();
          }}
        />
      )}
    </div>
  );
}
