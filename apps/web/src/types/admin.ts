export type Role = "ADMIN";

export interface AuthUser {
  id: string;
  role: Role;
  name?: string;
  email?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export type AuthStatus =
  | "idle"
  | "checking"
  | "authenticated"
  | "unauthenticated";
