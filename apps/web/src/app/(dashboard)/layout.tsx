"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/auth-context";
import { AppShell } from "../../components/layout/app-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen bg-surface overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-60 bg-surface-subtle border-r border-surface-border p-3 space-y-4 hidden lg:block shrink-0">
          <div className="h-8 bg-surface-panel rounded animate-pulse" />
          <div className="h-7 bg-surface-panel rounded animate-pulse" />
          <div className="space-y-2 pt-4">
            <div className="h-6 bg-surface-panel rounded animate-pulse" />
            <div className="h-6 bg-surface-panel rounded animate-pulse" />
            <div className="h-6 bg-surface-panel rounded animate-pulse" />
            <div className="h-6 bg-surface-panel rounded animate-pulse" />
          </div>
        </div>

        {/* Main area skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-12 border-b border-surface-border bg-surface-subtle/80 flex items-center px-4">
            <div className="h-4 w-32 bg-surface-panel rounded animate-pulse" />
          </div>
          <div className="p-6 space-y-4">
            <div className="h-8 w-48 bg-surface-panel rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="h-20 bg-surface-panel rounded animate-pulse" />
              <div className="h-20 bg-surface-panel rounded animate-pulse" />
              <div className="h-20 bg-surface-panel rounded animate-pulse" />
              <div className="h-20 bg-surface-panel rounded animate-pulse" />
            </div>
            <div className="h-64 bg-surface-panel rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated: will redirect, return null to avoid flash
  if (!isAuthenticated) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
