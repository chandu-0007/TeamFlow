"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { organizationsApi } from "../lib/api/organizations";
import type { Organization } from "../types/organization";
import { useAuth } from "./auth-context";

interface WorkspaceContextValue {
  organizations: Organization[];
  currentOrg: Organization | null;
  isLoading: boolean;
  switchOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (data: { name: string; description?: string }) => Promise<Organization>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshOrganizations = useCallback(async () => {
    if (!isAuthenticated) {
      setOrganizations([]);
      setCurrentOrg(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await organizationsApi.list();
      const orgs = res.organizations || [];
      setOrganizations(orgs);

      // Keep current selection if valid, else pick first or null
      setCurrentOrg((prev) => {
        if (prev && orgs.some((o) => o.id === prev.id)) {
          return orgs.find((o) => o.id === prev.id) || prev;
        }
        return orgs[0] || null;
      });
    } catch {
      setOrganizations([]);
      setCurrentOrg(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshOrganizations();
  }, [refreshOrganizations, user?.id]);

  const switchOrganization = useCallback(
    (orgId: string) => {
      const target = organizations.find((o) => o.id === orgId);
      if (target) {
        setCurrentOrg(target);
      }
    },
    [organizations]
  );

  const createOrganization = async (data: { name: string; description?: string }): Promise<Organization> => {
    const res = await organizationsApi.create(data);
    await refreshOrganizations();
    setCurrentOrg(res.organization);
    return res.organization;
  };

  const value: WorkspaceContextValue = {
    organizations,
    currentOrg,
    isLoading,
    switchOrganization,
    refreshOrganizations,
    createOrganization,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
