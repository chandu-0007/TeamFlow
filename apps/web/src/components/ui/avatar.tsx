"use client";

import React from "react";
import { cn } from "../../lib/utils/cn";
import { getInitials } from "../../lib/utils/format";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string | null;
  email?: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}

export function Avatar({ className, name, email, src, size = "sm", ...props }: AvatarProps) {
  const initials = getInitials(name, email);

  const sizes = {
    xs: "w-5 h-5 text-[10px]",
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  // Subtle deterministic color palette based on name/email
  const colorMap = [
    "bg-indigo-950 text-indigo-300 border-indigo-800/50",
    "bg-cyan-950 text-cyan-300 border-cyan-800/50",
    "bg-emerald-950 text-emerald-300 border-emerald-800/50",
    "bg-amber-950 text-amber-300 border-amber-800/50",
    "bg-violet-950 text-violet-300 border-violet-800/50",
    "bg-slate-900 text-slate-300 border-slate-700/50",
  ];
  const charCode = (name || email || "U").charCodeAt(0);
  const colorScheme = colorMap[charCode % colorMap.length];

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center font-medium border select-none overflow-hidden flex-shrink-0",
        sizes[size],
        colorScheme,
        className
      )}
      title={name || email || "User"}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || "User"} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
