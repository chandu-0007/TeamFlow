"use client";

import React, { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { organizationsApi } from "../../lib/api/organizations";
import { useToast } from "../../context/toast-context";
import type { OrganizationRole } from "../../types/organization";

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onInvited: () => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  organizationId,
  onInvited,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationRole>("MEMBER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await organizationsApi.inviteMember(organizationId, {
        email: email.trim().toLowerCase(),
        role,
      });

      toastSuccess("Invitation dispatched", `Sent to ${email.trim()}`);
      setEmail("");
      onInvited();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
      toastError(err.message || "Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Teammate" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-2xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
            Email Address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="colleague@company.com"
            autoFocus
            error={error || undefined}
          />
        </div>

        <div>
          <label className="block text-2xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as OrganizationRole)}
            className="w-full bg-surface-panel text-text-primary text-xs rounded-md px-3 py-1.5 border border-surface-border focus:outline-none focus:border-brand-500 cursor-pointer font-mono"
          >
            <option value="ADMIN">ADMIN - Full administrative access to workspace</option>
            <option value="MANAGER">MANAGER - Can create projects and invite members</option>
            <option value="MEMBER">MEMBER - Standard access to issues and projects</option>
            <option value="VIEWER">VIEWER - Read-only access to workspace</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
