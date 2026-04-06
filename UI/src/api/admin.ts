import { apiDelete, apiGet, apiPost } from "./client";

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
  billingExempt: boolean;
  billingExemptReason: string | null;
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
  role: "admin" | "test_trader";
  status: "ACTIVE" | "PENDING" | "DISABLED";
  joinDate: string;
  lastActive: string | null;
  source: "database" | "environment" | "test_trader";
  billingExemptReason?: string | null;
}

export interface AdminTestTrader {
  id: string;
  email: string;
  name: string;
  billingExempt: boolean;
  billingExemptReason: string | null;
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

export interface AdminAccountDeletionAuditItem {
  id: string;
  userId: string;
  userName: string;
  previousEmail: string;
  deletedEmail: string;
  deletedAt: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  hadBillingHistory: boolean;
  hadBrokerAccounts: boolean;
  hadApiKeys: boolean;
  metadata: unknown | null;
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
  paidSubscriptionInvoices: number;
  recognizedSubscriptionRevenue: number;
  completedAnalysisRuns: number;
  estimatedAnalysisRevenue: number;
  totalRecognizedRevenue: number;
  averageRevenuePerRun: number;
}

export interface AdminFinanceRevenuePoint {
  month: string;
  analysisRevenue: number;
  subscriptionRevenue: number;
  revenue: number;
  runs: number;
  invoices: number;
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
  paidSubscriptionInvoices: number;
  subscriptionRevenue: number;
  completedRuns: number;
  estimatedRevenue: number;
  totalRevenue: number;
  latestPaymentAt: string | null;
  latestRunAt: string | null;
}

export interface AdminFinanceData {
  summary: AdminFinanceSummary;
  monthlyRevenue: AdminFinanceRevenuePoint[];
  planMix: AdminFinancePlanMixItem[];
  accounts: AdminFinanceAccountItem[];
}

export interface AdminReferralCode {
  id: string;
  code: string;
  accountDiscountPercent: number;
  mlRunDiscountPercent: number;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    email: string;
    name: string;
  } | null;
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

export function createAdminTestTrader(input: {
  email: string;
  password: string;
  fullName?: string;
  metaTraderUsername?: string;
  brokerName?: string;
}) {
  return apiPost<{ ok: boolean; trader: AdminTestTrader }>("/api/admin/traders/create-test-user", input);
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

export function deleteAdminTestTrader(id: string) {
  return apiDelete<{ ok: boolean }>(`/api/admin/test-traders/${id}`);
}

export function fetchAdminStaff() {
  return apiGet<{ ok: boolean; items: AdminStaffMember[] }>("/api/admin/staff");
}

export function setAdminTestTraderAccess(id: string, enabled: boolean) {
  return apiPost<{ ok: boolean; staffMember: AdminStaffMember }>(`/api/admin/test-traders/${id}/access`, {
    enabled,
  });
}

export function fetchAdminChurnFeedback() {
  return apiGet<{
    ok: boolean;
    items: AdminChurnFeedbackItem[];
    summary: AdminChurnFeedbackSummary[];
  }>("/api/admin/churn-feedback");
}

export function fetchAdminAccountDeletionAudits() {
  return apiGet<{
    ok: boolean;
    items: AdminAccountDeletionAuditItem[];
  }>("/api/admin/account-deletion-audits");
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

export function fetchAdminReferralCodes() {
  return apiGet<{ ok: boolean; items: AdminReferralCode[] }>("/api/admin/referral-codes");
}

export function createAdminReferralCode(input: {
  code: string;
  accountDiscountPercent: number;
  mlRunDiscountPercent: number;
  durationDays: number;
  isActive: boolean;
}) {
  return apiPost<{ ok: boolean; referralCode: AdminReferralCode }>("/api/admin/referral-codes", input);
}

export function wipeAdminNonAdminData(confirmation: string) {
  return apiPost<{
    ok: boolean;
    summary: {
      waitlistEntriesDeleted: number;
      traderApplicationsDeleted: number;
      traderUsersDeleted: number;
    };
  }>("/api/admin/wipe-non-admin-data", { confirmation });
}
