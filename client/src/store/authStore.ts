import { create } from "zustand";
import { api, setAccessToken, getAccessToken } from "../services/api";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (!res.ok) throw new Error((await res.json()).error ?? "Login failed");
    const { accessToken } = await res.json();
    setAccessToken(accessToken);
    const meRes = await api.get("/auth/me");
    set({ user: await meRes.json(), accessToken });
  },

  register: async (email, password, name) => {
    const res = await api.post("/auth/register", { email, password, name });
    if (!res.ok) throw new Error((await res.json()).error ?? "Registration failed");
    const { accessToken } = await res.json();
    setAccessToken(accessToken);
    const meRes = await api.get("/auth/me");
    set({ user: await meRes.json(), accessToken });
  },

  logout: async () => {
    await api.post("/auth/logout");
    setAccessToken(null);
    set({ user: null, accessToken: null });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/auth/me");
      if (res.ok) set({ user: await res.json(), accessToken: getAccessToken() });
    } finally {
      set({ isLoading: false });
    }
  },
}));
