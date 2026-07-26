import { create } from "zustand";
import { http } from "../lib/http";
import type {
  AuthStatus,
  AuthUser,
  LoginPayload,
  LoginResponse,
  MeResponse,
} from "../types/admin";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;

  login: (payload: LoginPayload) => Promise<void>;

  logout: () => Promise<void>;

  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  login: async (payload) => {
    const { user } = await http.post<LoginResponse>("/auth/login", payload);
    set({ user, status: "authenticated" });
  },

  logout: async () => {
    try {
      await http.post("/auth/logout");
    } finally {
      set({ user: null, status: "unauthenticated" });
    }
  },

  fetchMe: async () => {
    set({ status: "checking" });
    try {
      const { user } = await http.get<MeResponse>("/auth/me");
      set({ user, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },
}));
