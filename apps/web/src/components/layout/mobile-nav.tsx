"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Search,
  Plus,
  X,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Avatar } from "../ui/avatar";
import { useAuth } from "../../context/auth-context";
import { cn } from "../../lib/utils/cn";

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  onOpenCreateIssue: () => void;
}

export function MobileNav({
  isOpen,
  onClose,
  onOpenSearch,
  onOpenCreateIssue,
}: MobileNavProps) {
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
    <>
      {/* Slide-over Drawer for full menu on mobile */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-72 max-w-[80vw] bg-surface-subtle border-r border-surface-border h-full flex flex-col justify-between z-10 shadow-2xl"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Navigation
                  </span>
                  <button
                    onClick={onClose}
                    className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-surface-hover"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <WorkspaceSwitcher />

                <nav className="space-y-1 pt-2">
                  {navItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/workspace" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive
                            ? "bg-white/[0.08] text-white font-medium border-l-2 border-white rounded-l-none"
                            : "text-text-secondary hover:text-white hover:bg-white/[0.04]"
                        )}
                      >
                        <span className={isActive ? "text-white" : "text-text-tertiary"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* User footer in Drawer */}
              <div className="p-4 border-t border-surface-border bg-surface-panel/50">
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
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    title="Log out"
                    className="text-text-tertiary hover:text-red-400 p-1.5 rounded hover:bg-surface-hover transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-surface-subtle/95 backdrop-blur border-t border-surface-border flex items-center justify-around px-2 z-40 select-none">
        <Link
          href="/workspace"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors",
            pathname === "/workspace" ? "text-white font-medium" : "text-text-tertiary hover:text-white"
          )}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Overview</span>
        </Link>

        <Link
          href="/issues"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors",
            pathname.startsWith("/issues") ? "text-white font-medium" : "text-text-tertiary hover:text-white"
          )}
        >
          <CheckSquare className="w-4 h-4 mb-0.5" />
          <span>Issues</span>
        </Link>

        {/* Center Quick Create Action */}
        <button
          onClick={onOpenCreateIssue}
          className="w-10 h-10 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform -mt-3 border-2 border-surface-subtle"
          aria-label="Create Issue"
        >
          <Plus className="w-5 h-5" />
        </button>

        <Link
          href="/projects"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors",
            pathname.startsWith("/projects") ? "text-white font-medium" : "text-text-tertiary hover:text-white"
          )}
        >
          <FolderKanban className="w-4 h-4 mb-0.5" />
          <span>Projects</span>
        </Link>

        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium text-text-tertiary hover:text-text-primary transition-colors"
        >
          <Search className="w-4 h-4 mb-0.5" />
          <span>Search</span>
        </button>
      </nav>
    </>
  );
}
