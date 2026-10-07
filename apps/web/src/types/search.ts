import type { Organization } from "./organization";
import type { Project } from "./project";
import type { Task } from "./task";

export interface SearchCounts {
  organizations: number;
  projects: number;
  tasks: number;
  members: number;
  total: number;
}

export interface SearchMemberResult {
  id: string;
  role: string;
  organizationId: string;
  organization?: { id: string; name: string; slug: string };
  user: {
    id: string;
    name: string;
    email: string;
  };
  joinedAt: string;
}

export interface GlobalSearchResults {
  organizations: Organization[];
  projects: Project[];
  tasks: Task[];
  members: SearchMemberResult[];
}

export interface GlobalSearchResponse {
  query: string;
  scopedOrganizationId?: string | null;
  counts: SearchCounts;
  results: GlobalSearchResults;
}
