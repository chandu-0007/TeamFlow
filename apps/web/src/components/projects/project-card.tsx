"use client";

import React from "react";
import Link from "next/link";
import { Users, CheckSquare, ArrowUpRight, Archive } from "lucide-react";
import type { Project } from "../../types/project";
import { Badge } from "../ui/badge";
import { formatRelativeTime } from "../../lib/utils/format";

export interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const isArchived = project.status === "ARCHIVED";

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative flex flex-col justify-between p-4 rounded-lg bg-surface-panel hover:bg-surface-hover border border-surface-border hover:border-surface-border-focus transition-all duration-150 shadow-subtle select-none"
    >
      <div>
        {/* Header: Name and Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-white transition-colors truncate">
            {project.name}
          </h3>
          {isArchived ? (
            <Badge variant="warning" size="xs">
              <Archive className="w-2.5 h-2.5 mr-1" />
              Archived
            </Badge>
          ) : (
            <Badge variant="brand" size="xs">
              Active
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
          {project.description || "No description provided."}
        </p>
      </div>

      {/* Footer: Metadata & Metrics */}
      <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between text-2xs text-text-tertiary font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1" title="Members">
            <Users className="w-3 h-3 text-text-tertiary" />
            {project._count?.projectMembers ?? 1}
          </span>
          <span className="flex items-center gap-1" title="Tasks">
            <CheckSquare className="w-3 h-3 text-text-tertiary" />
            {project._count?.tasks ?? 0}
          </span>
        </div>

        <div className="flex items-center gap-1 group-hover:text-text-secondary transition-colors">
          <span>{formatRelativeTime(project.updatedAt)}</span>
          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}
