"use client";

import React, { forwardRef } from "react";
import { cn } from "../../lib/utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-2xs font-medium text-text-tertiary uppercase tracking-wider select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full bg-surface-panel text-text-primary placeholder:text-text-tertiary text-sm rounded-md px-3 py-2 border border-surface-border transition-colors duration-150 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 disabled:opacity-50 disabled:bg-surface-subtle resize-y min-h-[80px]",
            error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/30" : "",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-2xs text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
