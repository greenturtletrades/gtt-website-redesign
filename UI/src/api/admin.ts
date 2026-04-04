import { apiGet, apiPost } from "./client";

export interface AdminLoginResponse {
  ok: boolean;
  token: string;
  mustChangePassword?: boolean;
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

export interface AdminTrader {
  id: string;
  name: string;
  email: string;
  accountStatus: "ACTIVE" | "PENDING" | "DISABLED" | "NO_ACCOUNT";
  applicationStatus: "PENDING" | "APPROVED" | "REJECTED" | "NONE";
  analysisStatus: "ANALYSIS_READY" | "NEEDS_ANALYSIS" | "NO_TRADE_DATA";
  plan: "payg" | "premium";
  joinedAt: string;
  country: string | null;
  platform: "MT4" | "MT5" | "CTRADER" | null;
  experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  brokerAccountsCount: number;
  activeBrokerAccountsCount: number;
  apiKeysCount: number;
  analysisRunCount: number;
  tradeEventCount: number;
  historyExportCount: number;
  lastEaSyncAt: string | null;
  hasAccount: boolean;
  hasApplication: boolean;
  latestAnalysisAt: string | null;
  latestAnalysisReport: unknown | null;
  metrics: {
    tradesAnalysed: number | null;
    avgRMultiple: number | null;
    winRate: number | null;
    sharpeRatio: number | null;
    maxDrawdownR: number | null;
    totalR: number | null;
  };
}

export interface AdminStaffMember {
  id: string;
  name: string;
  email: string;
  role: "admin";
  status: "ACTIVE" | "PENDING" | "DISABLED";
  joinDate: string;
  lastActive: string | null;
  source: "database" | "environment";
}

export interface AdminChurnFeedbackItem {
  id: string;
  userId: string;
  userName: string;
  email: string;
  plan: string;
  reason: string;
  feedback: string | null;
  createdAt: string;
}

export interface AdminChurnFeedbackSummary {
  reason: string;
  count: number;
}

export interface AdminSignupItem {
  id: string;
  email: string;
  sourceType: "landing_waitlist" | "investor_waitlist" | "trader_application" | "trader_account";
  status: string;
  submittedAt: string;
  name: string | null;
  detail: string | null;
}

export interface GroupedAdminSignupItem {
  id: string;
  email: string;
  name: string | null;
  sourceTypes: AdminSignupItem["sourceType"][];
  statuses: string[];
  details: string[];
  submittedAt: string;
  entryCount: number;
}

export interface AdminFinanceSummary {
  traderAccounts: number;
  paygAccounts: number;
  premiumAccounts: number;
  stripeCustomers: number;
  activeSubscriptions: number;
  completedAnalysisRuns: number;
  estimatedAnalysisRevenue: number;
  averageRevenuePerRun: number;
}

export interface AdminFinanceRevenuePoint {
  month: string;
  revenue: number;
  runs: number;
}

export interface AdminFinancePlanMixItem {
  name: string;
  value: number;
}

export interface AdminFinanceAccountItem {
  userId: string;
  email: string;
  name: string;
  plan: "payg" | "premium";
  stripeCustomerLinked: boolean;
  stripeSubscriptionLinked: boolean;
  completedRuns: number;
  estimatedRevenue: number;
  latestRunAt: string | null;
}

export interface AdminFinanceData {
  summary: AdminFinanceSummary;
  monthlyRevenue: AdminFinanceRevenuePoint[];
  planMix: AdminFinancePlanMixItem[];
  accounts: AdminFinanceAccountItem[];
}

export function adminLogin(email: string, password: string) {
  return apiPost<AdminLoginResponse>("/api/admin/login", { email, password });
}

export function inviteAdmin(email: string, temporaryCode: string) {
  return apiPost<{ ok: boolean; staffMember: AdminStaffMember }>("/api/admin/staff/invite", {
    email,
    temporaryCode,
  });
}

export function changeAdminPassword(currentPassword: string, newPassword: string) {
  return apiPost<{ ok: boolean }>("/api/admin/change-password", {
    currentPassword,
    newPassword,
  });
}

export function fetchAdminMetrics() {
  return apiGet<AdminMetrics>("/api/admin/metrics");
}

export function fetchAdminTraders() {
  return apiGet<{ ok: boolean; items: AdminTrader[] }>("/api/admin/traders");
}

export function fetchAdminStaff() {
  return apiGet<{ ok: boolean; items: AdminStaffMember[] }>("/api/admin/staff");
}

export function fetchAdminChurnFeedback() {
  return apiGet<{
    ok: boolean;
    items: AdminChurnFeedbackItem[];
    summary: AdminChurnFeedbackSummary[];
  }>("/api/admin/churn-feedback");
}

export function fetchAdminSignups() {
  return apiGet<{
    ok: boolean;
    items: AdminSignupItem[];
  }>("/api/admin/signups");
}

export function fetchAdminFinance() {
  return apiGet<{ ok: boolean; finance: AdminFinanceData }>("/api/admin/finance");
}
