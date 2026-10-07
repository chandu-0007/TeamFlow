"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Settings,
  Search,
  Plus,
  LogOut,
} from "lucide-react";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Avatar } from "../ui/avatar";
import { useAuth } from "../../context/auth-context";
import { cn } from "../../lib/utils/cn";

export interface SidebarProps {
  onOpenSearch: () => void;
  onOpenCreateIssue: () => void;
  className?: string;
}

export function Sidebar({ onOpenSearch, onOpenCreateIssue, className }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Overview", href: "/workspace", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Issues", href: "/issues", icon: <CheckSquare className="w-4 h-4" /> },
    { label: "Projects", href: "/projects", icon: <FolderKanban className="w-4 h-4" /> },
    { label: "Teammates", href: "/members", icon: <Users className="w-4 h-4" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={cn(
        "w-60 bg-surface-subtle border-r border-surface-border flex flex-col justify-between h-screen select-none",
        className
      )}
    >
      {/* Top: Header, Switcher, Search, Create */}
      <div className="p-3 space-y-3">
        {/* Workspace Switcher */}
        <WorkspaceSwitcher />

        {/* Action Controls */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="col-span-4 flex items-center justify-between px-2.5 py-1.5 rounded-md bg-surface-panel hover:bg-surface-hover border border-surface-border text-xs text-text-secondary hover:text-text-primary transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-text-tertiary" />
              <span>Search...</span>
            </div>
            <kbd className="text-[10px] font-mono text-text-tertiary bg-surface-subtle px-1 py-0.2 rounded border border-surface-border">
              ⌘K
            </kbd>
          </button>

          {/* Quick Create Issue */}
          <button
            onClick={onOpenCreateIssue}
            title="Create new issue (C)"
            className="flex items-center justify-center rounded-md bg-white hover:bg-neutral-200 text-black transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-0.5 pt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/workspace" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "bg-white/[0.08] text-white font-medium border-l-2 border-white rounded-l-none"
                    : "text-text-secondary hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <span className={cn(isActive ? "text-white" : "text-text-tertiary")}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: User Profile & Session Controls */}
      <div className="p-3 border-t border-surface-border bg-surface-panel/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={user?.name} email={user?.email} size="sm" />
            <div className="min-w-0">
              <span className="text-xs font-medium text-text-primary block truncate">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] text-text-tertiary block truncate">
                {user?.email}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="text-text-tertiary hover:text-red-400 p-1.5 rounded hover:bg-surface-hover transition-colors"
            aria-label="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
