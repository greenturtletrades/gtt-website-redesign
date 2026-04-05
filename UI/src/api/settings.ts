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

export interface BillingMethodSummary {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  funding: string | null;
  country: string | null;
}

export interface BillingInvoiceRecord {
  id: string;
  stripeInvoiceId: string | null;
  eventType: string;
  status: string | null;
  currency: string | null;
  amount: number | null;
  amountSubtotal: number | null;
  amountTax: number | null;
  amountPaid: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  occurredAt: string;
}

export interface MlRunChargeRecord {
  id: string;
  status: "due";
  mode: string;
  tradesAnalysed: number | null;
  amount: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface BillingSummaryResponse {
  ok: boolean;
  billing: {
    plan: "payg";
    subscriptionStatus: string;
    billingExempt?: boolean;
    billingExemptReason?: string | null;
    stripeConfigured: boolean;
    stripeCustomerLinked: boolean;
    stripeSubscriptionLinked: boolean;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    currentBillingMethod: BillingMethodSummary | null;
    referralCode: string | null;
    accountDiscountPercent: number;
    mlRunDiscountPercent: number;
    discountExpiresAt: string | null;
    mlRunChargesDue: number;
    totalPaidBilling: number;
    recentMlRunCharges: MlRunChargeRecord[];
    recentInvoices: BillingInvoiceRecord[];
  };
}

export interface AccountStateResponse {
  ok: boolean;
  account: {
    id: string;
    email: string;
    role: "TRADER" | "ADMIN";
    status: "ACTIVE" | "PENDING" | "DISABLED";
    plan: "payg" | null;
    billingExempt?: boolean;
    profile?: AuthUser["profile"] | null;
    billing: BillingSummaryResponse["billing"] | null;
  };
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

export function deleteMyAccount(input?: {
  reason?: string;
  feedback?: string;
  plan?: string | null;
}) {
  return apiDelete<{ ok: boolean }>("/api/me", input);
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

export function fetchBillingSummary() {
  return apiGet<BillingSummaryResponse>("/api/me/billing");
}

export function fetchAccountState() {
  return apiGet<AccountStateResponse>("/api/me/account-state");
}

export function createBillingPortalSession() {
  return apiPost<{ ok: boolean; url: string }>("/api/billing/portal-session", {});
}
