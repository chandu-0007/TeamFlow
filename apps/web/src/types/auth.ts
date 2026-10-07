export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
