"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      isLoading = false,
      disabled,
      icon,
      iconRight,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-white select-none disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]";

    const variants = {
      primary:
        "bg-white hover:bg-[#e6e6e6] text-[#08090a] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.6)] border border-white/80",
      secondary:
        "bg-surface-panel hover:bg-surface-hover text-text-primary border border-surface-border hover:border-surface-border-focus",
      ghost:
        "bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary",
      danger:
        "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
      outline:
        "bg-transparent hover:bg-surface-hover text-text-primary border border-surface-border",
    };

    const sizes = {
      xs: "text-2xs px-2 py-1 gap-1",
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-3.5 py-1.5 gap-2",
      lg: "text-base px-4 py-2 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
        {!isLoading && iconRight ? <span className="flex-shrink-0">{iconRight}</span> : null}
      </button>
    );
  }
);

Button.displayName = "Button";
