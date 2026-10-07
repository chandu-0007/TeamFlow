"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";
import { useWorkspace } from "../../context/workspace-context";
import { Modal } from "../ui/modal";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useToast } from "../../context/toast-context";

export function WorkspaceSwitcher() {
  const { organizations, currentOrg, switchOrganization, createOrganization } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsSubmitting(true);
    try {
      const org = await createOrganization({ name: newOrgName.trim() });
      toastSuccess("Workspace created", org.name);
      setNewOrgName("");
      setIsCreateOpen(false);
      setIsOpen(false);
    } catch (err: any) {
      toastError(err.message || "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-panel hover:bg-surface-hover border border-surface-border text-left transition-colors select-none group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded bg-white text-black font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-subtle">
              {(currentOrg?.name || "T")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-text-primary block truncate">
                {currentOrg?.name || "Select Workspace"}
              </span>
              <span className="text-[10px] font-mono text-text-tertiary block truncate">
                {currentOrg?.userRole || "Workspace"}
              </span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-text-tertiary group-hover:text-text-secondary flex-shrink-0 ml-1 transition-transform duration-150" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-56 rounded-lg bg-surface-raised border border-surface-border shadow-dropdown p-1 z-50 text-text-primary">
            <div className="px-2 py-1 text-[10px] font-mono text-text-tertiary uppercase tracking-wider">
              Workspaces
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
              {organizations.map((org) => {
                const isSelected = org.id === currentOrg?.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchOrganization(org.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-surface-hover text-left text-xs transition-colors group"
                  >
                    <span className="truncate text-text-primary font-medium">{org.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-1 border-t border-surface-border">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsCreateOpen(true);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-hover text-left text-xs text-white font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Workspace"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateOrg} className="space-y-4">
          <div>
            <label className="block text-2xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
              Workspace Name
            </label>
            <Input
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="e.g. Acme Corp, Engineering"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
