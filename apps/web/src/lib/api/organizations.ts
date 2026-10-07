import { apiClient } from "./client";
import type {
  Organization,
  OrganizationsListResponse,
  MembersListResponse,
  InvitationsListResponse,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationRole,
} from "../../types/organization";

export interface CreateOrgDto {
  name: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
}

export interface UpdateOrgDto {
  name?: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
}

export interface InviteMemberDto {
  email: string;
  role: OrganizationRole;
}

export const organizationsApi = {
  list: async (params?: { search?: string; role?: string; sortBy?: string; order?: string; page?: number; limit?: number }): Promise<OrganizationsListResponse> => {
    return apiClient<OrganizationsListResponse>("/api/organizations", {
      method: "GET",
      params,
    });
  },

  get: async (id: string): Promise<{ organization: Organization; userRole?: OrganizationRole }> => {
    return apiClient<{ organization: Organization; userRole?: OrganizationRole }>(`/api/organizations/${id}`, {
      method: "GET",
    });
  },

  create: async (data: CreateOrgDto): Promise<{ message: string; organization: Organization }> => {
    return apiClient<{ message: string; organization: Organization }>("/api/organizations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateOrgDto): Promise<{ message: string; organization: Organization }> => {
    return apiClient<{ message: string; organization: Organization }>(`/api/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/api/organizations/${id}`, {
      method: "DELETE",
    });
  },

  leave: async (id: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/api/organizations/${id}/leave`, {
      method: "POST",
    });
  },

  listMembers: async (id: string, params?: { search?: string; role?: string; sortBy?: string; order?: string; page?: number; limit?: number }): Promise<MembersListResponse> => {
    return apiClient<MembersListResponse>(`/api/organizations/${id}/members`, {
      method: "GET",
      params,
    });
  },

  inviteMember: async (id: string, data: InviteMemberDto): Promise<{ message: string; invitation: OrganizationInvitation }> => {
    return apiClient<{ message: string; invitation: OrganizationInvitation }>(`/api/organizations/${id}/invitations`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  changeMemberRole: async (id: string, memberId: string, role: OrganizationRole): Promise<{ message: string; member: OrganizationMember }> => {
    return apiClient<{ message: string; member: OrganizationMember }>(`/api/organizations/${id}/members/${memberId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  removeMember: async (id: string, memberId: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>(`/api/organizations/${id}/members/${memberId}`, {
      method: "DELETE",
    });
  },

  listInvitations: async (id: string, params?: { search?: string; status?: string; sortBy?: string; order?: string; page?: number; limit?: number }): Promise<InvitationsListResponse> => {
    return apiClient<InvitationsListResponse>(`/api/organizations/${id}/invitations`, {
      method: "GET",
      params,
    });
  },

  acceptInvitation: async (token: string): Promise<{ message: string; organization: Organization }> => {
    return apiClient<{ message: string; organization: Organization }>("/api/organizations/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
};
