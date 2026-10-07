"use client";

import React from "react";
import { cn } from "../../lib/utils/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function Tabs({ tabs, activeTab, onChange, className, size = "md" }: TabsProps) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-surface-border overflow-x-auto no-scrollbar", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 font-medium transition-colors duration-150 select-none whitespace-nowrap border-b-2 -mb-[1px]",
              size === "sm" ? "text-xs" : "text-sm",
              isActive
                ? "text-white border-white font-semibold"
                : "text-text-secondary hover:text-white border-transparent hover:border-surface-border"
            )}
          >
            {tab.icon && <span className="text-text-tertiary">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                  isActive
                    ? "bg-white/10 text-white"
                    : "bg-surface-raised text-text-tertiary"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
