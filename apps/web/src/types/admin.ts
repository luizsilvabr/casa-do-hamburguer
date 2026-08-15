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

export interface AdminCategory {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  productCount: number;
}

export type CategoryStatusFilter = "todas" | "ativas" | "inativas";

export interface CategoryInput {
  name: string;
  order?: number;
}

export interface AdminProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  optionGroupCount: number;
}

export type StatusFilter = "todas" | "ativas" | "inativas";

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
}
