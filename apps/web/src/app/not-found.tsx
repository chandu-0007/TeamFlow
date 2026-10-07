import Link from "next/link";
import { ArrowLeft, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center select-none linear-spotlight linear-grid">
      <div className="w-full max-w-md space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-panel border border-surface-border text-white">
          <Compass className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-2.5 py-0.5 rounded-full text-2xs font-mono font-medium tracking-wide bg-white/10 text-white border border-white/20">
            404 NOT FOUND
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Route not found
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            The page or resource you requested does not exist, has been moved, or belongs to another workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/workspace"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors shadow-subtle"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Workspace</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-surface-panel hover:bg-surface-hover border border-surface-border text-text-secondary hover:text-text-primary text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
