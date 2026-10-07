"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Check, Clock, UserCheck, Calendar } from "lucide-react";
import { Drawer } from "../ui/drawer";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Avatar } from "../ui/avatar";
import { tasksApi } from "../../lib/api/tasks";
import { useToast } from "../../context/toast-context";
import { formatIssueId, formatDate } from "../../lib/utils/format";
import type { Task, TaskStatus, TaskPriority } from "../../types/task";

export interface IssueDetailDrawerProps {
  issue?: Task | null;
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedIssue: Task) => void;
  onTaskUpdated?: (updatedTask: Task) => void;
  onDeleted?: (issueId: string) => void;
  onTaskDeleted?: (taskId: string) => void;
}

export function IssueDetailDrawer({
  issue,
  task,
  isOpen,
  onClose,
  onUpdated,
  onTaskUpdated,
  onDeleted,
  onTaskDeleted,
}: IssueDetailDrawerProps) {
  const currentTask = task || issue || null;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    if (currentTask) {
      setTitle(currentTask.title);
      setDescription(currentTask.description || "");
      setStatus(currentTask.status);
      setPriority(currentTask.priority);
    }
  }, [currentTask]);

  if (!currentTask) return null;

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      const res = await tasksApi.update(currentTask.id, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
      });
      toastSuccess("Saved", "Issue updated");
      onUpdated?.(res.task);
      onTaskUpdated?.(res.task);
    } catch (err: any) {
      toastError(err.message || "Failed to update issue");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    setIsDeleting(true);
    try {
      await tasksApi.delete(currentTask.id);
      toastSuccess("Deleted", "Issue deleted successfully");
      onDeleted?.(currentTask.id);
      onTaskDeleted?.(currentTask.id);
      onClose();
    } catch (err: any) {
      toastError(err.message || "Failed to delete issue");
    } finally {
      setIsDeleting(false);
    }
  };

  const issueId = formatIssueId(currentTask.id);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={issueId}
      description={currentTask.project?.name || "Project Issue"}
      width="lg"
    >
      <div className="space-y-6">
        {/* Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            placeholder="Issue title"
            className="w-full bg-transparent text-lg font-semibold text-text-primary border-none focus:outline-none focus:ring-0 p-0 tracking-tight"
          />
        </div>

        {/* Metadata Controls Matrix */}
        <div className="grid grid-cols-2 gap-4 p-3.5 rounded-lg bg-surface-raised border border-surface-border">
          {/* Status */}
          <div>
            <label className="flex items-center gap-1.5 text-2xs font-medium text-text-tertiary mb-1.5">
              <Check className="w-3 h-3" />
              <span>Status</span>
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as TaskStatus);
                setTimeout(handleSave, 50);
              }}
              className="w-full bg-surface-panel text-text-primary text-xs rounded px-2.5 py-1 border border-surface-border focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="flex items-center gap-1.5 text-2xs font-medium text-text-tertiary mb-1.5">
              <Clock className="w-3 h-3" />
              <span>Priority</span>
            </label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as TaskPriority);
                setTimeout(handleSave, 50);
              }}
              className="w-full bg-surface-panel text-text-primary text-xs rounded px-2.5 py-1 border border-surface-border focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="flex items-center gap-1.5 text-2xs font-medium text-text-tertiary mb-1.5">
              <UserCheck className="w-3 h-3" />
              <span>Assignee</span>
            </label>
            <div className="flex items-center gap-2 text-xs text-text-secondary py-1">
              <Avatar
                name={currentTask.assignee?.name}
                email={currentTask.assignee?.email}
                size="xs"
              />
              <span className="truncate">{currentTask.assignee?.name || "Unassigned"}</span>
            </div>
          </div>

          {/* Created Date */}
          <div>
            <label className="flex items-center gap-1.5 text-2xs font-medium text-text-tertiary mb-1.5">
              <Calendar className="w-3 h-3" />
              <span>Created</span>
            </label>
            <div className="text-xs text-text-secondary py-1 font-mono">
              {formatDate(currentTask.createdAt)}
            </div>
          </div>
        </div>

        {/* Description Editor */}
        <div>
          <label className="block text-2xs font-medium text-text-tertiary mb-1.5 uppercase tracking-wider">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            placeholder="Add detailed description or notes..."
            className="min-h-[160px] text-xs leading-relaxed"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-surface-border">
          <Button
            variant="danger"
            size="xs"
            onClick={handleDelete}
            isLoading={isDeleting}
            icon={<Trash2 className="w-3 h-3" />}
          >
            Delete issue
          </Button>

          <Button
            variant="primary"
            size="xs"
            onClick={handleSave}
            isLoading={isSaving}
          >
            Save changes
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
