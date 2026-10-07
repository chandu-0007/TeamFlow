"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log unexpected errors for client monitoring
    console.error("Application error captured:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full max-w-md space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-2.5 py-0.5 rounded-full text-2xs font-mono font-medium tracking-wide bg-red-500/10 text-red-400 border border-red-500/20">
            SYSTEM EXCEPTION
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Something went wrong
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            An unexpected error occurred while processing this view. You can reload this section or navigate back to safety.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>

          <Link
            href="/workspace"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-surface-panel hover:bg-surface-hover border border-surface-border text-text-secondary hover:text-text-primary text-xs font-medium transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Workspace</span>
          </Link>
        </div>

        {/* Technical stack collapse for developers */}
        {error.message && (
          <div className="pt-4 border-t border-surface-border/60 text-left">
            <button
              onClick={() => setShowDetails((prev) => !prev)}
              className="w-full flex items-center justify-between text-2xs text-text-tertiary hover:text-text-secondary py-1"
            >
              <span>Technical details</span>
              {showDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {showDetails && (
              <pre className="mt-2 p-3 rounded bg-surface-panel border border-surface-border text-[11px] font-mono text-text-tertiary overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
