"use client";

import React from "react";
import { Shield, Trash2 } from "lucide-react";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { formatDate } from "../../lib/utils/format";
import type { OrganizationMember, OrganizationRole } from "../../types/organization";

export interface MemberRowProps {
  member: OrganizationMember;
  currentUserRole?: OrganizationRole;
  isCurrentUser: boolean;
  onRoleChange?: (memberId: string, role: OrganizationRole) => void;
  onRemove?: (memberId: string) => void;
}

export function MemberRow({
  member,
  currentUserRole,
  isCurrentUser,
  onRoleChange,
  onRemove,
}: MemberRowProps) {
  const canManage =
    (currentUserRole === "OWNER" || currentUserRole === "ADMIN") &&
    !isCurrentUser &&
    member.role !== "OWNER";

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-border hover:bg-surface-hover/50 transition-colors">
      {/* User Info */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={member.user.name} email={member.user.email} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">
              {member.user.name}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] font-mono text-text-tertiary bg-surface-raised px-1.5 py-0.2 rounded border border-surface-border">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary truncate">{member.user.email}</p>
        </div>
      </div>

      {/* Role and Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-2xs font-mono text-text-tertiary hidden sm:inline-block">
          Joined {formatDate(member.createdAt)}
        </span>

        {canManage && onRoleChange ? (
          <select
            value={member.role}
            onChange={(e) => onRoleChange(member.id, e.target.value as OrganizationRole)}
            className="bg-surface-panel text-xs text-text-primary rounded px-2 py-1 border border-surface-border focus:outline-none focus:border-brand-500 cursor-pointer font-mono"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="MEMBER">MEMBER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        ) : (
          <Badge
            variant={member.role === "OWNER" ? "brand" : member.role === "ADMIN" ? "warning" : "default"}
            size="sm"
          >
            {member.role === "OWNER" && <Shield className="w-2.5 h-2.5 mr-1" />}
            {member.role}
          </Badge>
        )}

        {canManage && onRemove && (
          <button
            onClick={() => onRemove(member.id)}
            className="text-text-tertiary hover:text-red-400 p-1 rounded hover:bg-surface-raised transition-colors"
            title="Remove member"
            aria-label="Remove member"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
