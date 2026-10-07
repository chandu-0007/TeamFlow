"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { projectsApi } from "../../lib/api/projects";
import { useToast } from "../../context/toast-context";
import type { Project } from "../../types/project";

export interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onCreated?: (newProject: Project) => void;
  onSuccess?: () => void;
}

export function ProjectCreateModal({
  isOpen,
  onClose,
  organizationId,
  onCreated,
  onSuccess,
}: ProjectCreateModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    if (!organizationId) {
      setError("Active organization context is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await projectsApi.create({
        organizationId,
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
      });

      toastSuccess("Project created", res.project.name);
      onCreated?.(res.project);
      onSuccess?.();
      setName("");
      setSlug("");
      setDescription("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      toastError(err.message || "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Project" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-2xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
            Project Name
          </label>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Core Engine, Web App, Mobile"
            autoFocus
            error={error || undefined}
          />
        </div>

        <div>
          <label className="block text-2xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
            Identifier Slug
          </label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. core-engine"
          />
        </div>

        <div>
          <label className="block text-2xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project focusing on?"
            className="min-h-[90px]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
