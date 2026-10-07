"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Search, X, Mail } from "lucide-react";
import { useWorkspace } from "../../../context/workspace-context";
import { useAuth } from "../../../context/auth-context";
import { organizationsApi } from "../../../lib/api/organizations";
import type {
  OrganizationMember,
  OrganizationRole,
  OrganizationInvitation,
} from "../../../types/organization";
import { MemberRow } from "../../../components/members/member-row";
import { InviteMemberModal } from "../../../components/members/invite-member-modal";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";
import { Skeleton } from "../../../components/ui/skeleton";
import { Badge } from "../../../components/ui/badge";
import { useToast } from "../../../context/toast-context";
import { formatDate } from "../../../lib/utils/format";

export default function MembersPage() {
  const { currentOrg } = useWorkspace();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<OrganizationRole | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentOrg) return;

    setIsLoading(true);
    try {
      const [membersRes, orgRes, invitesRes] = await Promise.all([
        organizationsApi.listMembers(currentOrg.id, {
          search: search.trim() || undefined,
          limit: 100,
        }),
        organizationsApi.get(currentOrg.id),
        organizationsApi.listInvitations(currentOrg.id).catch(() => ({ invitations: [] })),
      ]);

      setMembers(membersRes.members || []);
      setCurrentUserRole(orgRes.userRole);
      setInvitations(invitesRes.invitations || []);
    } catch (err: any) {
      console.error("Failed to load members:", err);
      toastError(err.message || "Failed to load teammates");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, search, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleRoleChange = async (memberId: string, newRole: OrganizationRole) => {
    if (!currentOrg) return;
    try {
      await organizationsApi.changeMemberRole(currentOrg.id, memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      toastSuccess("Role updated");
    } catch (err: any) {
      toastError(err.message || "Failed to update member role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentOrg) return;
    if (!window.confirm("Are you sure you want to remove this member from the workspace?")) {
      return;
    }
    try {
      await organizationsApi.removeMember(currentOrg.id, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toastSuccess("Member removed");
    } catch (err: any) {
      toastError(err.message || "Failed to remove member");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">
              Teammates
            </h1>
            <span className="text-2xs font-mono text-text-tertiary bg-surface-panel px-2 py-0.5 rounded border border-surface-border">
              {members.length}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage organization members, roles, permissions, and pending invites.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Teammate</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-xs">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter teammates by name or email..."
          className="w-full bg-surface-panel text-text-primary placeholder:text-text-tertiary text-xs rounded-md pl-8 pr-7 py-1.5 border border-surface-border focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5"
            aria-label="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Members List Container */}
      <div className="bg-surface-subtle border border-surface-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-surface-panel/40 border-b border-surface-border flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-text-tertiary">
          <span>Member</span>
          <span>Role & Permissions</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6 text-text-tertiary" />}
            title="No teammates found"
            description={
              search
                ? "No member matched your search query."
                : "Invite your colleagues to start collaborating in this workspace."
            }
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsInviteOpen(true)}
              >
                Invite Member
              </Button>
            }
          />
        ) : (
          <div>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                currentUserRole={currentUserRole}
                isCurrentUser={member.userId === user?.id}
                onRoleChange={handleRoleChange}
                onRemove={handleRemoveMember}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations Section (if any) */}
      {invitations.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-text-primary">
              Pending Invitations
            </h2>
            <span className="text-2xs font-mono text-text-tertiary bg-surface-panel px-1.5 py-0.5 rounded border border-surface-border">
              {invitations.length}
            </span>
          </div>

          <div className="bg-surface-subtle border border-surface-border rounded-lg divide-y divide-surface-border overflow-hidden">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 flex items-center justify-between hover:bg-surface-hover/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-panel border border-surface-border flex items-center justify-center text-text-tertiary">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-primary block">
                      {inv.email}
                    </span>
                    <span className="text-2xs text-text-tertiary block">
                      Invited on {formatDate(inv.createdAt)}
                    </span>
                  </div>
                </div>

                <Badge variant="warning" size="xs">
                  {inv.role} (Pending)
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {currentOrg && (
        <InviteMemberModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          organizationId={currentOrg.id}
          onInvited={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
