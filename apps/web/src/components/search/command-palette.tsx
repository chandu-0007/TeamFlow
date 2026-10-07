"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  CheckSquare,
  FolderKanban,
  Users,
  Plus,
  Settings,
  LogOut,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { searchApi } from "../../lib/api/search";
import { useWorkspace } from "../../context/workspace-context";
import { useAuth } from "../../context/auth-context";
import { formatIssueId } from "../../lib/utils/format";
import type { Task } from "../../types/task";
import type { Project } from "../../types/project";
import type { SearchMemberResult } from "../../types/search";

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateIssue?: () => void;
  onSelectIssue?: (issue: Task) => void;
  onSelectProject?: (project: Project) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenCreateIssue,
  onSelectIssue,
  onSelectProject,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<SearchMemberResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { currentOrg } = useWorkspace();
  const { logout } = useAuth();

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      setQuery("");
      setTasks([]);
      setProjects([]);
      setMembers([]);
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Search API execution with debounce
  useEffect(() => {
    if (!query.trim()) {
      setTasks([]);
      setProjects([]);
      setMembers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchApi.globalSearch({
          q: query.trim(),
          organizationId: currentOrg?.id,
          limit: 6,
        });
        setTasks(res.results.tasks || []);
        setProjects(res.results.projects || []);
        setMembers(res.results.members || []);
      } catch {
        // Fail quietly in search palette
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, currentOrg?.id]);

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  const hasResults = tasks.length > 0 || projects.length > 0 || members.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Palette Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl bg-surface-raised border border-surface-border rounded-xl shadow-cmdk overflow-hidden text-text-primary z-10"
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-border">
              <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search issues, projects, members..."
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-text-tertiary flex-shrink-0" />
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary bg-surface-panel border border-surface-border rounded">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results / Commands Body */}
            <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-surface-border/40">
              {/* Dynamic Search Results */}
              {query.trim() && (
                <div className="space-y-4 pb-2">
                  {/* Matching Issues */}
                  {tasks.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-2xs font-semibold text-text-tertiary uppercase tracking-wider">
                        Issues
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {tasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => handleNavigate("/issues")}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-surface-hover text-left transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckSquare className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
                              <span className="font-mono text-2xs text-text-tertiary">
                                {formatIssueId(task.id)}
                              </span>
                              <span className="text-xs text-text-primary truncate">
                                {task.title}
                              </span>
                            </div>
                            <span className="text-2xs text-text-tertiary font-mono">
                              {task.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Projects */}
                  {projects.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-2xs font-semibold text-text-tertiary uppercase tracking-wider">
                        Projects
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => handleNavigate(`/projects/${project.id}`)}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-surface-hover text-left transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FolderKanban className="w-3.5 h-3.5 text-white flex-shrink-0" />
                              <span className="text-xs text-text-primary font-medium truncate">
                                {project.name}
                              </span>
                            </div>
                            <span className="text-2xs text-text-tertiary font-mono">
                              {project.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Members */}
                  {members.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-2xs font-semibold text-text-tertiary uppercase tracking-wider">
                        Teammates
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {members.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => handleNavigate("/members")}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-surface-hover text-left transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Users className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
                              <span className="text-xs text-text-primary font-medium truncate">
                                {member.user.name}
                              </span>
                              <span className="text-2xs text-text-tertiary truncate">
                                {member.user.email}
                              </span>
                            </div>
                            <span className="text-2xs font-mono text-text-tertiary">
                              {member.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isLoading && !hasResults && (
                    <div className="text-center py-6 text-xs text-text-tertiary">
                      No results found for &ldquo;{query}&rdquo;
                    </div>
                  )}
                </div>
              )}

              {/* Standard Commands */}
              <div className="pt-2">
                <div className="px-2 py-1 text-2xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Quick Actions
                </div>
                <div className="space-y-0.5 mt-1">
                  {onOpenCreateIssue && (
                    <button
                      onClick={() => handleAction(onOpenCreateIssue)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-surface-hover text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Plus className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs text-text-primary font-medium">Create issue</span>
                      </div>
                      <kbd className="text-[10px] font-mono text-text-tertiary bg-surface-panel px-1.5 py-0.2 rounded border border-surface-border">
                        C
                      </kbd>
                    </button>
                  )}

                  <button
                    onClick={() => handleNavigate("/issues")}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-surface-hover text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="w-3.5 h-3.5 text-text-tertiary" />
                      <span className="text-xs text-text-primary">Go to Issues</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-text-tertiary" />
                  </button>

                  <button
                    onClick={() => handleNavigate("/projects")}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-surface-hover text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderKanban className="w-3.5 h-3.5 text-text-tertiary" />
                      <span className="text-xs text-text-primary">Go to Projects</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-text-tertiary" />
                  </button>

                  <button
                    onClick={() => handleNavigate("/members")}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-surface-hover text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-3.5 h-3.5 text-text-tertiary" />
                      <span className="text-xs text-text-primary">Manage Teammates</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-text-tertiary" />
                  </button>

                  <button
                    onClick={() => handleNavigate("/settings")}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-surface-hover text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-3.5 h-3.5 text-text-tertiary" />
                      <span className="text-xs text-text-primary">Workspace Settings</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-text-tertiary" />
                  </button>

                  <button
                    onClick={() => handleAction(logout)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-red-500/10 text-left transition-colors text-red-400"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Log out</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Shortcut Guide */}
            <div className="px-4 py-2 bg-surface-panel border-t border-surface-border text-2xs text-text-tertiary flex items-center justify-between font-mono">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              <span>⌘K / Ctrl+K</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
