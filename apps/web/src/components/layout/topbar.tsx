"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, Plus, Bell } from "lucide-react";
import { useWorkspace } from "../../context/workspace-context";
import { useAuth } from "../../context/auth-context";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";

export interface TopbarProps {
  onToggleMobileNav: () => void;
  onOpenSearch: () => void;
  onOpenCreateIssue: () => void;
}

export function Topbar({ onToggleMobileNav, onOpenSearch, onOpenCreateIssue }: TopbarProps) {
  const pathname = usePathname();
  const { currentOrg } = useWorkspace();
  const { user } = useAuth();

  // Compute breadcrumb title based on pathname
  const getBreadcrumb = () => {
    if (pathname.startsWith("/issues")) return "Issues";
    if (pathname.startsWith("/projects")) return "Projects";
    if (pathname.startsWith("/members")) return "Teammates";
    if (pathname.startsWith("/settings")) return "Settings";
    if (pathname.startsWith("/workspace")) return "Workspace Overview";
    return "Dashboard";
  };

  return (
    <header className="h-12 border-b border-surface-border bg-surface-subtle/80 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-1.5 -ml-1 text-text-tertiary hover:text-text-primary rounded-md hover:bg-surface-hover"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-text-secondary hidden sm:inline-block max-w-[140px] truncate">
            {currentOrg?.name || "Workspace"}
          </span>
          <span className="text-text-tertiary hidden sm:inline-block">/</span>
          <span className="text-text-primary font-semibold">{getBreadcrumb()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-panel hover:bg-surface-hover border border-surface-border text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="hidden md:inline">Search workspace</span>
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-text-tertiary bg-surface-subtle px-1 rounded border border-surface-border">
            ⌘K
          </kbd>
        </button>

        {/* Quick New Issue Action */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreateIssue}
          className="hidden sm:flex items-center gap-1.5 h-7 text-xs px-2.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Issue</span>
        </Button>

        {/* User Avatar */}
        <div className="pl-1">
          <Avatar name={user?.name} email={user?.email} size="sm" />
        </div>
      </div>
    </header>
  );
}
