"use client";

import React, { forwardRef } from "react";
import { cn } from "../../lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, icon, iconRight, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-2xs font-medium text-text-tertiary uppercase tracking-wider select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-text-tertiary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-surface-panel text-text-primary placeholder:text-text-tertiary text-sm rounded-md px-3 py-1.5 border border-surface-border transition-colors duration-150 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 disabled:opacity-50 disabled:bg-surface-subtle",
              icon ? "pl-8" : "",
              iconRight ? "pr-8" : "",
              error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/30" : "",
              className
            )}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-2.5 flex items-center pointer-events-none text-text-tertiary">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-2xs text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
