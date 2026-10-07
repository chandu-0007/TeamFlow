"use client";

import React from "react";
import type { Task, TaskStatus } from "../../types/task";
import { formatIssueId, formatRelativeTime } from "../../lib/utils/format";
import { IssueStatusBadge } from "./issue-status-badge";
import { IssuePriorityIcon } from "./issue-priority-icon";
import { Avatar } from "../ui/avatar";
import { cn } from "../../lib/utils/cn";

export interface IssueRowProps {
  task?: Task;
  issue?: Task;
  onClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  className?: string;
}

export function IssueRow({ task, issue, onClick, onStatusChange, className }: IssueRowProps) {
  const currentTask = task || issue;
  if (!currentTask) return null;

  const issueId = formatIssueId(currentTask.id);

  return (
    <div
      onClick={() => onClick?.(currentTask)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(currentTask);
        }
      }}
      className={cn(
        "group flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-2.5 border-b border-surface-border/70 hover:bg-surface-hover transition-colors duration-100 text-left select-none cursor-pointer focus:outline-none focus:bg-surface-hover",
        className
      )}
    >
      {/* Priority Icon */}
      <div className="flex-shrink-0" title={`Priority: ${currentTask.priority}`}>
        <IssuePriorityIcon priority={currentTask.priority} />
      </div>

      {/* Identifier */}
      <span className="flex-shrink-0 font-mono text-2xs text-text-tertiary group-hover:text-text-secondary transition-colors">
        {issueId}
      </span>

      {/* Status Badge */}
      <div
        className="flex-shrink-0"
        onClick={(e) => {
          if (onStatusChange) {
            e.stopPropagation();
          }
        }}
      >
        <IssueStatusBadge status={currentTask.status} showLabel={false} />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0 mr-2">
        <span className="text-sm text-text-primary group-hover:text-white transition-colors truncate block font-normal">
          {currentTask.title}
        </span>
      </div>

      {/* Project Tag */}
      {currentTask.project && (
        <span className="hidden md:inline-flex items-center text-2xs font-medium text-text-tertiary px-2 py-0.5 rounded bg-surface-raised border border-surface-border truncate max-w-[120px]">
          {currentTask.project.name}
        </span>
      )}

      {/* Assignee Avatar */}
      <div className="flex-shrink-0">
        {currentTask.assignee ? (
          <Avatar
            name={currentTask.assignee.name}
            email={currentTask.assignee.email}
            size="xs"
            className="ring-1 ring-surface-border"
          />
        ) : (
          <div
            className="w-5 h-5 rounded-full border border-dashed border-surface-border flex items-center justify-center text-text-tertiary text-[9px]"
            title="Unassigned"
          >
            -
          </div>
        )}
      </div>

      {/* Timestamp */}
      <span className="hidden sm:inline-block flex-shrink-0 text-2xs font-mono text-text-tertiary w-16 text-right">
        {formatRelativeTime(currentTask.createdAt)}
      </span>
    </div>
  );
}
