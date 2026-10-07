/**
 * Utility functions for formatting dates, strings, and identifiers.
 */

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
}

export function getInitials(name: string | null | undefined, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name[0] || "U").toUpperCase();
  }
  if (email && email.trim()) {
    return email[0] ? email[0].toUpperCase() : "U";
  }
  return "U";
}

export function formatIssueId(id: string, prefix = "TF"): string {
  if (!id) return `${prefix}-0`;
  // Extract alphanumeric compact hash for clear, linear-like identifiers
  const clean = id.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${prefix}-${clean}`;
}
