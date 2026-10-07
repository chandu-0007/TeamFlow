import React from "react";
import Link from "next/link";
import { Layers } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-hidden linear-spotlight linear-grid">
      {/* Main card */}
      <div className="w-full max-w-sm sm:max-w-md relative z-10 space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-transform duration-200 active:scale-95"
          >
            <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold shadow-subtle group-hover:bg-neutral-200 transition-colors">
              <Layers className="w-4 h-4 text-black" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              TeamFlow
            </span>
          </Link>
        </div>

        {/* Auth form surface */}
        <div className="bg-surface-subtle border border-surface-border rounded-xl p-6 sm:p-8 shadow-modal">
          {children}
        </div>

        {/* Discreet bottom footer */}
        <p className="text-center text-2xs text-text-tertiary">
          Protected by enterprise-grade session encryption & cookie authentication.
        </p>
      </div>
    </div>
  );
}
