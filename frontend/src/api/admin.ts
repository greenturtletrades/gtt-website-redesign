import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export interface AdminLoginResponse {
  ok: boolean;
  token: string;
  mustChangePassword?: boolean;
  user: {
    id: string;
    email: string;
    role: "ADMIN";
    isSuperAdmin?: boolean;
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
  platformComped: boolean;
  platformCompedReason: string | null;
  accountStatus: "ACTIVE" | "PENDING" | "DISABLED" | "NO_ACCOUNT";
  applicationStatus: "PENDING" | "APPROVED" | "REJECTED" | "NONE";
  analysisStatus: "ANALYSIS_READY" | "NEEDS_ANALYSIS" | "NO_TRADE_DATA";
  plan: "free" | "payg";
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
  role: "admin" | "super_admin" | "test_trader";
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

export interface GroupedAdminSignupItem {
  id: string;
  email: string;
  name: string | null;
  sourceTypes: ("landing_waitlist" | "investor_waitlist" | "trader_application" | "trader_account")[];
  statuses: string[];
  details: string[];
  submittedAt: string;
  entryCount: number;
  reviewStatus: "ACTIVE" | "SUSPECT" | "INVALID";
  doNotContact: boolean;
  reviewReason: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
}

export interface AdminSignupSummary {
  totalUniqueEmails: number;
  validUniqueEmails: number;
  contactableUniqueEmails: number;
  suspectUniqueEmails: number;
  invalidUniqueEmails: number;
  landingSignupCount: number;
  investorSignupCount: number;
  traderApplicationSignupCount: number;
  traderAccountSignupCount: number;
}

export interface AdminFinanceSummary {
  traderAccounts: number;
  freeAccounts: number;
  paygAccounts: number;
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
  plan: "free" | "payg";
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

export function inviteAdmin(email: string, temporaryCode: string, accessLevel: "admin" | "super_admin" = "admin") {
  return apiPost<{ ok: boolean; staffMember: AdminStaffMember }>("/api/admin/staff/invite", {
    email,
    temporaryCode,
    accessLevel,
  });
}

export function createAdminTestTrader(input: {
  email: string;
  password: string;
  fullName?: string;
  metaTraderUsername?: string;
  brokerName?: string;
}) {
  return apiPost<{ ok: boolean; staffMember: AdminStaffMember }>("/api/admin/traders/create-test-user", input);
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

export function updateTraderStatus(id: string, status: "ACTIVE" | "DISABLED") {
  return apiPatch<{ ok: boolean; status: string }>(`/api/admin/traders/${id}/status`, { status });
}

export function adminResetTraderPassword(id: string) {
  return apiPost<{ ok: boolean }>(`/api/admin/traders/${id}/reset-password`, {});
}

export function adminSyncTraderStripe(id: string) {
  return apiPost<{ ok: boolean; stripeSubscriptionId: string; stripeStatus: string }>(`/api/admin/traders/${id}/sync-stripe`, {});
}

export function setTraderPlatformComp(id: string, enabled: boolean) {
  return apiPost<{ ok: boolean; platformComped: boolean; platformCompedReason: string | null; email: string }>(
    `/api/admin/traders/${id}/platform-comp`,
    { enabled },
  );
}

export function fetchAdminStaff() {
  return apiGet<{ ok: boolean; items: AdminStaffMember[] }>("/api/admin/staff");
}

export function setAdminTestTraderAccess(id: string, enabled: boolean) {
  return apiPost<{ ok: boolean; staffMember: AdminStaffMember }>(`/api/admin/test-traders/${id}/access`, {
    enabled,
  });
}

export function wipeAdminStaffTraderData(id: string) {
  return apiPost<{ ok: boolean; staffMember: AdminStaffMember }>(`/api/admin/staff/${id}/wipe-trader-side`, {});
}

export function promoteAdminToSuper(id: string) {
  return apiPost<{ ok: boolean; staffMember: AdminStaffMember }>(`/api/admin/staff/${id}/promote-super-admin`, {});
}

export function removeAdminAccess(id: string) {
  return apiDelete<{ ok: boolean; mode: "deleted" | "demoted_to_trader"; staffMember?: AdminStaffMember }>(`/api/admin/staff/${id}`);
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
    items: GroupedAdminSignupItem[];
    summary: AdminSignupSummary;
  }>("/api/admin/signups");
}

export function updateAdminSignupReview(input: {
  email: string;
  status: "ACTIVE" | "SUSPECT" | "INVALID";
  doNotContact: boolean;
  reason?: string;
  notes?: string;
}) {
  return apiPost<{
    ok: boolean;
    review: {
      email: string;
      status: "ACTIVE" | "SUSPECT" | "INVALID";
      doNotContact: boolean;
      reason: string | null;
      notes: string | null;
      reviewedAt: string | null;
    };
  }>("/api/admin/signups/review", input);
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
