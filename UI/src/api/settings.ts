import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { AuthUser } from "./auth";

export interface BrokerAccount {
  id: string;
  platform: "MT4" | "MT5" | "CTRADER";
  brokerName: string | null;
  accountNumber: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  last4: string;
  createdAt: string;
  revokedAt: string | null;
}

export function updateProfile(fullName: string, email: string) {
  return apiPatch<{ ok: boolean; user: AuthUser }>("/api/me/profile", {
    fullName,
    email,
  });
}

export function changeTraderPassword(currentPassword: string, newPassword: string) {
  return apiPost<{ ok: boolean }>("/api/me/change-password", {
    currentPassword,
    newPassword,
  });
}

export function deleteMyAccount() {
  return apiDelete<{ ok: boolean }>("/api/me");
}

export function fetchBrokerAccounts() {
  return apiGet<{ ok: boolean; brokerAccounts: BrokerAccount[] }>("/api/broker-accounts");
}

export function createBrokerAccount(input: {
  platform: BrokerAccount["platform"];
  brokerName?: string;
  accountNumber: string;
  label?: string;
  isActive?: boolean;
}) {
  return apiPost<{ ok: boolean; brokerAccount: BrokerAccount }>("/api/broker-accounts", input);
}

export function updateBrokerAccount(id: string, input: Partial<{
  platform: BrokerAccount["platform"];
  brokerName: string;
  accountNumber: string;
  label: string;
  isActive: boolean;
}>) {
  return apiPatch<{ ok: boolean; brokerAccount: BrokerAccount }>(`/api/broker-accounts/${id}`, input);
}

export function fetchApiKeys() {
  return apiGet<{ ok: boolean; apiKeys: ApiKeyRecord[] }>("/api/api-keys");
}

export function createApiKey(name: string) {
  return apiPost<{
    ok: boolean;
    apiKey: ApiKeyRecord & { key: string };
  }>("/api/api-keys", { name });
}

export function revokeApiKey(id: string) {
  return apiDelete<{ ok: boolean }>(`/api/api-keys/${id}`);
}
