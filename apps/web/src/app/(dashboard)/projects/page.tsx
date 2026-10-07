"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FolderKanban, Plus, Search, X } from "lucide-react";
import { useWorkspace } from "../../../context/workspace-context";
import { projectsApi } from "../../../lib/api/projects";
import type { Project, ProjectStatus } from "../../../types/project";
import { ProjectCard } from "../../../components/projects/project-card";
import { ProjectCreateModal } from "../../../components/projects/project-create-modal";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";
import { Skeleton } from "../../../components/ui/skeleton";
import { useToast } from "../../../context/toast-context";
import { cn } from "../../../lib/utils/cn";

export default function ProjectsPage() {
  const { currentOrg } = useWorkspace();
  const { error: toastError } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "ALL">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!currentOrg) return;

    setIsLoading(true);
    try {
      const res = await projectsApi.list(currentOrg.id, {
        search: search.trim() || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 50,
      });
      setProjects(res.projects || []);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
      toastError(err.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, search, statusFilter, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Projects
            </h1>
            <span className="text-2xs font-mono text-text-tertiary bg-surface-panel px-2 py-0.5 rounded border border-surface-border">
              {projects.length}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Organize milestones, initiatives, and roadmaps across your teams.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-surface-panel text-text-primary placeholder:text-text-tertiary text-xs rounded-md pl-8 pr-7 py-1.5 border border-surface-border focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-md border border-surface-border self-start sm:self-auto">
          {(["ALL", "ACTIVE", "ARCHIVED"] as const).map((s) => {
            const isActive = statusFilter === s;
            const labels: Record<string, string> = {
              ALL: "All",
              ACTIVE: "Active",
              ARCHIVED: "Archived",
            };
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-2.5 py-1 text-2xs font-medium rounded transition-all select-none",
                  isActive
                    ? "bg-white/[0.08] text-white shadow-subtle border border-white/10"
                    : "text-text-tertiary hover:text-text-primary"
                )}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-6 h-6 text-text-tertiary" />}
          title={search ? "No matching projects" : "No projects yet"}
          description={
            search
              ? "No project found matching your search term."
              : "Group your tasks into milestones by creating your first project."
          }
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
            >
              Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Project Create Modal */}
      {currentOrg && (
        <ProjectCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          organizationId={currentOrg.id}
          onSuccess={() => {
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
