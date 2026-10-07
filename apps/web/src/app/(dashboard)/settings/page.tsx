"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Trash2, LogOut, Check, Building2 } from "lucide-react";
import { useWorkspace } from "../../../context/workspace-context";
import { organizationsApi } from "../../../lib/api/organizations";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { useToast } from "../../../context/toast-context";

export default function SettingsPage() {
  const router = useRouter();
  const { currentOrg, refreshOrganizations } = useWorkspace();
  const { success: toastSuccess, error: toastError } = useToast();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      setName(currentOrg.name || "");
      setSlug(currentOrg.slug || "");
      setDescription(currentOrg.description || "");
      setWebsiteUrl(currentOrg.websiteUrl || "");
    }
  }, [currentOrg]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsSaving(true);
    try {
      await organizationsApi.update(currentOrg.id, {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
      });

      await refreshOrganizations();
      toastSuccess("Settings saved", "Workspace profile has been updated.");
    } catch (err: any) {
      toastError(err.message || "Failed to update workspace settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeave = async () => {
    if (!currentOrg) return;
    if (!window.confirm("Are you sure you want to leave this workspace?")) return;

    setIsLeaving(true);
    try {
      await organizationsApi.leave(currentOrg.id);
      await refreshOrganizations();
      toastSuccess("Left workspace");
      router.push("/workspace");
    } catch (err: any) {
      toastError(err.message || "Failed to leave workspace");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentOrg) return;
    const confirmName = window.prompt(
      `To permanently delete this workspace, please type "${currentOrg.name}":`
    );
    if (confirmName !== currentOrg.name) {
      if (confirmName !== null) {
        toastError("Workspace name did not match. Deletion aborted.");
      }
      return;
    }

    setIsDeleting(true);
    try {
      await organizationsApi.delete(currentOrg.id);
      await refreshOrganizations();
      toastSuccess("Workspace deleted");
      router.push("/workspace");
    } catch (err: any) {
      toastError(err.message || "Failed to delete workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentOrg) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <Building2 className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
        <h2 className="text-sm font-semibold text-text-primary">No workspace selected</h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8 select-none">
      {/* Header */}
      <div className="pb-4 border-b border-surface-border">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Workspace Settings
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure general details, vanity slug, and workspace governance.
        </p>
      </div>

      {/* General Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-surface-subtle border border-surface-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">General Profile</h2>

          <Input
            label="Workspace Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Workspace Slug / Identifier"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            helperText="URL identifier for your organization"
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of your team or engineering department..."
            rows={3}
          />

          <Input
            label="Website URL"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://company.com"
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              className="flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-surface-subtle border border-red-500/20 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-red-400">
          <Shield className="w-4 h-4" />
          <h2 className="text-sm font-semibold">Danger Zone</h2>
        </div>

        <div className="divide-y divide-surface-border">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-text-primary block">
                Leave Workspace
              </span>
              <span className="text-2xs text-text-tertiary block">
                Revoke your access to this organization and its projects.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLeave}
              isLoading={isLeaving}
              className="flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </Button>
          </div>

          <div className="pt-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-red-400 block">
                Delete Workspace
              </span>
              <span className="text-2xs text-text-tertiary block">
                Permanently purge this organization, all projects, and tasks.
              </span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
