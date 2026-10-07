import { apiClient } from "./client";
import type { AuthResponse, User } from "../../types/auth";

export interface SignupDto {
  name: string;
  email: string;
  password: string;
}

export interface SigninDto {
  email: string;
  password: string;
}

export const authApi = {
  signup: async (data: SignupDto): Promise<AuthResponse> => {
    return apiClient<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  signin: async (data: SigninDto): Promise<AuthResponse> => {
    return apiClient<AuthResponse>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<{ user: User }> => {
    return apiClient<{ user: User }>("/api/auth/me", {
      method: "GET",
    });
  },

  logout: async (): Promise<{ message: string }> => {
    return apiClient<{ message: string }>("/api/auth/logout", {
      method: "POST",
    });
  },

  sendVerificationOtp: async (email: string): Promise<{ message: string; userId: string }> => {
    return apiClient<{ message: string; userId: string }>("/api/auth/email/send", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifyEmailOtp: async (userId: string, otp: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>("/api/auth/email/verify", {
      method: "POST",
      body: JSON.stringify({ userId, otp }),
    });
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (email: string, otp: string, newPassword: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },
};
