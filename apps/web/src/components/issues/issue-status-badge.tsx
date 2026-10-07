"use client";

import React from "react";
import { CircleDot, Circle, Clock, CheckCircle2, HelpCircle } from "lucide-react";
import type { TaskStatus } from "../../types/task";
import { cn } from "../../lib/utils/cn";

export interface IssueStatusBadgeProps {
  status: TaskStatus;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function IssueStatusBadge({
  status,
  className,
  showLabel = true,
  size = "sm",
}: IssueStatusBadgeProps) {
  const configs: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
    BACKLOG: {
      label: "Backlog",
      color: "text-zinc-500",
      icon: <CircleDot className="w-3.5 h-3.5" />,
    },
    TODO: {
      label: "Todo",
      color: "text-zinc-300",
      icon: <Circle className="w-3.5 h-3.5" />,
    },
    IN_PROGRESS: {
      label: "In Progress",
      color: "text-amber-400",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    IN_REVIEW: {
      label: "In Review",
      color: "text-violet-400",
      icon: <CircleDot className="w-3.5 h-3.5" />,
    },
    DONE: {
      label: "Done",
      color: "text-emerald-400",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  };

  const config = configs[status] || {
    label: status,
    color: "text-text-tertiary",
    icon: <HelpCircle className="w-3.5 h-3.5" />,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 select-none font-medium",
        size === "sm" ? "text-xs" : "text-sm",
        config.color,
        className
      )}
    >
      <span className="flex-shrink-0">{config.icon}</span>
      {showLabel && <span className="text-text-secondary">{config.label}</span>}
    </span>
  );
}
