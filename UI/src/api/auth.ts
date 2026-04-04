import { apiGet, apiPost } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  role: "TRADER" | "ADMIN";
  status: "ACTIVE" | "PENDING" | "DISABLED";
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
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

export function register(input: {
  email: string;
  password: string;
  name?: string;
  metaTraderUsername?: string;
  brokerName?: string;
  referralCode?: string;
}) {
  return apiPost<AuthResponse>("/api/auth/register", input);
}

export function login(email: string, password: string) {
  return apiPost<AuthResponse>("/api/auth/login", { email, password });
}

export function me() {
  return apiGet<MeResponse>("/api/me");
}
