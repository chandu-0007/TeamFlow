"use client";

import React from "react";
import { FolderKanban } from "lucide-react";
import { cn } from "../../lib/utils/cn";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = <FolderKanban className="w-8 h-8 text-text-tertiary" />,
  title,
  description,
  action,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-dashed border-surface-border bg-surface-subtle/50 my-4",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-surface-panel border border-surface-border flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-text-primary tracking-tight mb-1">{title}</h3>
      <p className="text-xs text-text-secondary max-w-sm mb-5 leading-relaxed">{description}</p>
      {action ? (
        <div>{action}</div>
      ) : (
        (actionLabel || secondaryActionLabel) && (
          <div className="flex items-center gap-2">
            {actionLabel && onAction && (
              <Button variant="primary" size="sm" onClick={onAction}>
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )
      )}
    </div>
  );
}
