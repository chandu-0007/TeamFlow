"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi, type SigninDto, type SignupDto } from "../lib/api/auth";
import type { User, AuthState } from "../types/auth";
import { useToast } from "./toast-context";

interface AuthContextValue extends AuthState {
  signin: (credentials: SigninDto) => Promise<void>;
  signup: (data: SignupDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signin = async (credentials: SigninDto) => {
    setIsLoading(true);
    try {
      const res = await authApi.signin(credentials);
      setUser(res.user);
      toastSuccess("Welcome back", "Signed in successfully");
      router.push("/workspace");
    } catch (err: any) {
      toastError(err.message || "Failed to sign in. Please verify your credentials.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupDto) => {
    setIsLoading(true);
    try {
      const res = await authApi.signup(data);
      setUser(res.user);
      toastSuccess("Account created", "Welcome to TeamFlow");
      router.push("/workspace");
    } catch (err: any) {
      toastError(err.message || "Failed to create account.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signin,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
