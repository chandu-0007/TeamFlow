"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { CommandPalette } from "../search/command-palette";
import { IssueCreateModal } from "../issues/issue-create-modal";
import { useWorkspace } from "../../context/workspace-context";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { currentOrg } = useWorkspace();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette (Cmd+K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      // Check if user is typing inside an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("[role='dialog']");

      if (isInput) return;

      // 'c' shortcut to create new issue
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setIsCreateIssueOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-base text-text-primary">
      {/* Desktop Sidebar (hidden on screens < 1024px) */}
      <Sidebar
        className="hidden lg:flex shrink-0"
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
      />

      {/* Main App Layout */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
        />

        {/* Scrollable page body */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Responsive Navigation Drawer & Bottom Bar for Mobile/Tablet */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenCreateIssue={() => {
          setIsSearchOpen(false);
          setIsCreateIssueOpen(true);
        }}
      />

      {/* Global Issue Creation Modal */}
      {currentOrg && (
        <IssueCreateModal
          isOpen={isCreateIssueOpen}
          onClose={() => setIsCreateIssueOpen(false)}
          organizationId={currentOrg.id}
          onSuccess={() => {
            // Toast or refresh will trigger via events/context
          }}
        />
      )}
    </div>
  );
}
