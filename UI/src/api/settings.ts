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

export interface EaDownloadResponse {
  ok: boolean;
  filename: string;
  content: string;
  apiKeyLast4: string;
  brokerAccountId: string;
  brokerAccountNumber: string;
  platform: "MT4" | "MT5";
}

export interface EaStatusResponse {
  ok: boolean;
  platform: "MT4" | "MT5" | "CTRADER" | null;
  brokerAccountId: string | null;
  brokerAccountNumber: string | null;
  brokerName: string | null;
  eaConnected: boolean;
  eaLastSeenAt: string | null;
  eaLastHeartbeatAt: string | null;
  eaLastExportAt: string | null;
  onlineWindowMinutes: number;
}

export interface EaDiagnosticsResponse {
  ok: boolean;
  connection: {
    eaConnected: boolean;
    eaLastSeenAt: string | null;
    eaLastHeartbeatAt: string | null;
    eaLastExportAt: string | null;
    onlineWindowMinutes: number;
  };
  profile: {
    brokerAccountId: string | null;
    accountNumber: string | null;
    brokerName: string | null;
    platform: "MT4" | "MT5" | "CTRADER" | null;
  };
  expected: {
    apiBaseUrl: string;
    exportRequestPath: string;
    historyExportPath: string;
    heartbeatPath: string;
  };
  telemetry: {
    latestRequestAt: string | null;
    latestExportAt: string | null;
    recentEvents: Array<{
      id: string;
      type: string;
      receivedAt: string | null;
    }>;
  };
  hints: string[];
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

export function downloadEaFile(platform: "MT4" | "MT5") {
  return apiPost<EaDownloadResponse>("/api/ea/download", { platform });
}

export function fetchEaStatus() {
  return apiGet<EaStatusResponse>("/api/ea/status");
}

export function fetchEaDiagnostics() {
  return apiGet<EaDiagnosticsResponse>("/api/ea/diagnostics");
}
