"use client";

import React from "react";
import { cn } from "../../lib/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text";
}

export function Skeleton({ className, variant = "rectangular", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-surface-active/60 rounded",
        variant === "circular" ? "rounded-full" : "",
        variant === "text" ? "h-3.5 w-full rounded-sm" : "",
        className
      )}
      {...props}
    />
  );
}

export function IssueRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border animate-pulse">
      <Skeleton className="w-4 h-4 rounded" />
      <Skeleton className="w-16 h-3 rounded" />
      <Skeleton className="w-4 h-4 rounded-full" />
      <Skeleton className="flex-1 h-3.5 rounded max-w-md" />
      <div className="flex items-center gap-2 ml-auto">
        <Skeleton className="w-20 h-4 rounded" />
        <Skeleton className="w-5 h-5 rounded-full" />
        <Skeleton className="w-12 h-3 rounded" />
      </div>
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-surface-panel border border-surface-border space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="w-32 h-4 rounded" />
        <Skeleton className="w-12 h-4 rounded" />
      </div>
      <Skeleton className="w-full h-3 rounded" />
      <Skeleton className="w-2/3 h-3 rounded" />
      <div className="pt-2 flex items-center justify-between">
        <Skeleton className="w-16 h-3 rounded" />
        <Skeleton className="w-20 h-3 rounded" />
      </div>
    </div>
  );
}
