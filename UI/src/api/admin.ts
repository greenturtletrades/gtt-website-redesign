import { apiGet, apiPost } from "./client";

export interface AdminLoginResponse {
  ok: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    role: "ADMIN";
    status: "ACTIVE" | "PENDING" | "DISABLED";
  };
}

export interface AdminMetrics {
  waitlistCount: number;
  contactCount: number;
  createdTodayWaitlistCount: number;
}

export function adminLogin(email: string, password: string) {
  return apiPost<AdminLoginResponse>("/api/admin/login", { email, password });
}

export function fetchAdminMetrics() {
  return apiGet<AdminMetrics>("/api/admin/metrics");
}
