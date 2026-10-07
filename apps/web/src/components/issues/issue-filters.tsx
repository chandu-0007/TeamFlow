"use client";

import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import type { TaskStatus, TaskPriority } from "../../types/task";
import { cn } from "../../lib/utils/cn";

export interface IssueFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: TaskStatus | "ALL";
  onStatusChange: (status: TaskStatus | "ALL") => void;
  priorityFilter: TaskPriority | "ALL";
  onPriorityChange: (priority: TaskPriority | "ALL") => void;
  totalCount: number;
}

export function IssueFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  totalCount,
}: IssueFiltersProps) {
  const statuses: Array<{ id: TaskStatus | "ALL"; label: string }> = [
    { id: "ALL", label: "All" },
    { id: "TODO", label: "Todo" },
    { id: "IN_PROGRESS", label: "In Progress" },
    { id: "IN_REVIEW", label: "In Review" },
    { id: "DONE", label: "Done" },
    { id: "BACKLOG", label: "Backlog" },
  ];

  const priorities: Array<{ id: TaskPriority | "ALL"; label: string }> = [
    { id: "ALL", label: "All Priorities" },
    { id: "URGENT", label: "Urgent" },
    { id: "HIGH", label: "High" },
    { id: "MEDIUM", label: "Medium" },
    { id: "LOW", label: "Low" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
      {/* Search Input */}
      <div className="relative flex-1 max-w-xs">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter issues..."
          className="w-full bg-surface-panel text-text-primary placeholder:text-text-tertiary text-xs rounded-md pl-8 pr-7 py-1.5 border border-surface-border focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5"
            aria-label="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-md border border-surface-border">
          {statuses.map((s) => {
            const isActive = statusFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onStatusChange(s.id)}
                className={cn(
                  "px-2 py-1 text-2xs font-medium rounded transition-all select-none whitespace-nowrap",
                  isActive
                    ? "bg-white/[0.08] text-white shadow-subtle border border-white/10"
                    : "text-text-tertiary hover:text-text-primary"
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Priority Select */}
        <div className="relative flex items-center">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value as TaskPriority | "ALL")}
            className="bg-surface-panel text-text-secondary hover:text-text-primary text-2xs font-medium rounded-md px-2.5 py-1.5 border border-surface-border focus:outline-none focus:border-white/40 cursor-pointer appearance-none pr-6"
          >
            {priorities.map((p) => (
              <option key={p.id} value={p.id} className="bg-surface-raised text-text-primary">
                {p.label}
              </option>
            ))}
          </select>
          <SlidersHorizontal className="w-3 h-3 absolute right-2 pointer-events-none text-text-tertiary" />
        </div>

        {/* Counter */}
        <span className="text-2xs font-mono text-text-tertiary px-1.5 py-0.5 rounded bg-surface-raised border border-surface-border">
          {totalCount}
        </span>
      </div>
    </div>
  );
}
