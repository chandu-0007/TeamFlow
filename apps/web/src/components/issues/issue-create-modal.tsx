"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { tasksApi } from "../../lib/api/tasks";
import { projectsApi } from "../../lib/api/projects";
import { useToast } from "../../context/toast-context";
import type { Project } from "../../types/project";
import type { TaskStatus, TaskPriority, Task } from "../../types/task";

export interface IssueCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: Project[];
  organizationId?: string;
  defaultProjectId?: string;
  onCreated?: (newTask: Task) => void;
  onSuccess?: () => void;
}

export function IssueCreateModal({
  isOpen,
  onClose,
  projects: initialProjects,
  organizationId,
  defaultProjectId,
  onCreated,
  onSuccess,
}: IssueCreateModalProps) {
  const [projectList, setProjectList] = useState<Project[]>(initialProjects || []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId || "");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    if (initialProjects && initialProjects.length > 0) {
      setProjectList(initialProjects);
      if (!selectedProjectId) {
        setSelectedProjectId(defaultProjectId || initialProjects[0]?.id || "");
      }
    } else if (organizationId && isOpen) {
      projectsApi.list(organizationId).then((res) => {
        const orgProjects = res.projects || [];
        setProjectList(orgProjects);
        if (!selectedProjectId) {
          setSelectedProjectId(defaultProjectId || orgProjects[0]?.id || "");
        }
      }).catch((err) => {
        console.error("Failed to load projects for create modal", err);
      });
    }
  }, [initialProjects, organizationId, isOpen, defaultProjectId, selectedProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Issue title is required");
      return;
    }
    const targetProject = selectedProjectId || projectList[0]?.id;
    if (!targetProject) {
      setError("Please select or create a project first");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await tasksApi.create(targetProject, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
      });

      toastSuccess("Issue created", `#${res.task.id.slice(0, 4)}`);
      onCreated?.(res.task);
      onSuccess?.();
      setTitle("");
      setDescription("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create issue");
      toastError(err.message || "Failed to create issue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Issue" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Selector */}
        <div>
          <label className="block text-2xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
            Project
          </label>
          {projectList.length > 0 ? (
            <select
              value={selectedProjectId || projectList[0]?.id || ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-surface-panel text-text-primary text-xs rounded-md px-3 py-1.5 border border-surface-border focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              {projectList.map((p) => (
                <option key={p.id} value={p.id} className="bg-surface-raised text-text-primary">
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-2xs text-amber-400">
              No projects exist in this workspace. Please create a project before adding issues.
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Issue title"
            autoFocus
            className="text-sm font-medium"
            error={error || undefined}
          />
        </div>

        {/* Description */}
        <div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description..."
            className="min-h-[100px] text-xs leading-relaxed"
          />
        </div>

        {/* Status & Priority Row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-2xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full bg-surface-panel text-text-primary text-xs rounded-md px-3 py-1.5 border border-surface-border focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-surface-panel text-text-primary text-xs rounded-md px-3 py-1.5 border border-surface-border focus:outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            disabled={projectList.length === 0}
          >
            Create Issue
          </Button>
        </div>
      </form>
    </Modal>
  );
}
