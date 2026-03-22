import { apiGet, apiPost } from "./client";

interface AuthUser {
  id: string;
  email: string;
  role: "TRADER" | "ADMIN";
  status: "ACTIVE" | "PENDING" | "DISABLED";
  profile?: unknown | null;
}

interface AuthResponse {
  ok: boolean;
  token: string;
  user: AuthUser;
}

interface MeResponse {
  ok: boolean;
  user: AuthUser;
}

export function register(email: string, password: string) {
  return apiPost<AuthResponse>("/api/auth/register", { email, password });
}

export function login(email: string, password: string) {
  return apiPost<AuthResponse>("/api/auth/login", { email, password });
}

export function me() {
  return apiGet<MeResponse>("/api/me");
}
