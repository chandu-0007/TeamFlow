"use client";

import React from "react";
import { cn } from "../../lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "brand" | "success" | "warning" | "danger" | "outline" | "subtle";
  size?: "xs" | "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-white/[0.05] text-text-secondary border-surface-border",
    brand: "bg-white/10 text-white border-white/20 font-medium",
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    danger: "bg-red-500/10 text-red-300 border-red-500/20",
    outline: "bg-transparent text-text-secondary border-surface-border",
    subtle: "bg-white/[0.02] text-text-tertiary border-transparent",
  };

  const sizes = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-2xs px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border font-mono tracking-tight select-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
