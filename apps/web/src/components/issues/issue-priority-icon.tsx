"use client";

import React from "react";
import { AlertTriangle, SignalHigh, SignalMedium, SignalLow, Minus } from "lucide-react";
import type { TaskPriority } from "../../types/task";
import { cn } from "../../lib/utils/cn";

export interface IssuePriorityIconProps {
  priority: TaskPriority;
  className?: string;
  showLabel?: boolean;
}

export function IssuePriorityIcon({ priority, className, showLabel = false }: IssuePriorityIconProps) {
  const configs: Record<TaskPriority, { label: string; color: string; icon: React.ReactNode }> = {
    URGENT: {
      label: "Urgent",
      color: "text-red-400",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    HIGH: {
      label: "High",
      color: "text-orange-400",
      icon: <SignalHigh className="w-3.5 h-3.5" />,
    },
    MEDIUM: {
      label: "Medium",
      color: "text-blue-400",
      icon: <SignalMedium className="w-3.5 h-3.5" />,
    },
    LOW: {
      label: "Low",
      color: "text-zinc-500",
      icon: <SignalLow className="w-3.5 h-3.5" />,
    },
  };

  const config = configs[priority] || {
    label: priority,
    color: "text-text-tertiary",
    icon: <Minus className="w-3.5 h-3.5" />,
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 select-none text-xs font-medium", config.color, className)}>
      <span className="flex-shrink-0">{config.icon}</span>
      {showLabel && <span className="text-text-secondary">{config.label}</span>}
    </span>
  );
}
