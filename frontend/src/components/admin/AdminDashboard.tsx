import { Users, TrendingUp, Activity, Shield, Search, BarChart3, Brain, Eye, Filter, Calendar, UserX, BookOpen, UserPlus, DollarSign, CreditCard, PoundSterling, Lock, Unlock, KeyRound, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TraderDetailsModal } from "./TraderDetailsModal";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  createAdminTestTrader,
  deleteAdminTestTrader,
  fetchAdminAccountDeletionAudits,
  createAdminReferralCode,
  fetchAdminChurnFeedback,
  fetchAdminFinance,
  fetchAdminReferralCodes,
  fetchAdminSignups,
  fetchAdminStaff,
  promoteAdminToSuper,
  removeAdminAccess,
  setAdminTestTraderAccess,
  wipeAdminStaffTraderData,
  fetchAdminTraders,
  inviteAdmin,
  updateTraderStatus,
  adminResetTraderPassword,
  adminSyncTraderStripe,
  setTraderPlatformComp,
  updateAdminSignupReview,
  type AdminSignupSummary,
  type AdminChurnFeedbackItem,
  type AdminAccountDeletionAuditItem,
  type AdminFinanceData,
  type AdminChurnFeedbackSummary,
  type AdminReferralCode,
  type AdminStaffMember,
  type AdminTrader,
  type GroupedAdminSignupItem,
} from "../../api/admin";

interface AdminDashboardProps {
  currentAdminIsSuperAdmin: boolean;
  onLogout: () => void;
}

export function AdminDashboard({ currentAdminIsSuperAdmin, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<"overview" | "signups" | "finance" | "staff" | "churn" | "audits" | "guide">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrader, setSelectedTrader] = useState<AdminTrader | null>(null);
  const [traderFilter, setTraderFilter] = useState<"all" | "most-exports" | "most-trades" | "needs-analysis">("all");
  const [timePeriod, setTimePeriod] = useState<"7d" | "30d" | "3m" | "6m" | "1y" | "all">("30d");
  const [traders, setTraders] = useState<AdminTrader[]>([]);
  const [tradersLoading, setTradersLoading] = useState(true);
  const [tradersError, setTradersError] = useState<string | null>(null);
  const [staffMembers, setStaffMembers] = useState<AdminStaffMember[]>([]);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [churnItems, setChurnItems] = useState<AdminChurnFeedbackItem[]>([]);
  const [churnSummary, setChurnSummary] = useState<AdminChurnFeedbackSummary[]>([]);
  const [churnError, setChurnError] = useState<string | null>(null);
  const [deletionAudits, setDeletionAudits] = useState<AdminAccountDeletionAuditItem[]>([]);
  const [deletionAuditError, setDeletionAuditError] = useState<string | null>(null);
  const [signupItems, setSignupItems] = useState<GroupedAdminSignupItem[]>([]);
  const [signupSummary, setSignupSummary] = useState<AdminSignupSummary>({
    totalUniqueEmails: 0,
    validUniqueEmails: 0,
    contactableUniqueEmails: 0,
    suspectUniqueEmails: 0,
    invalidUniqueEmails: 0,
    landingSignupCount: 0,
    investorSignupCount: 0,
    traderApplicationSignupCount: 0,
    traderAccountSignupCount: 0,
  });
  const [signupError, setSignupError] = useState<string | null>(null);
  const [financeData, setFinanceData] = useState<AdminFinanceData | null>(null);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [referralCodes, setReferralCodes] = useState<AdminReferralCode[]>([]);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referralSubmitting, setReferralSubmitting] = useState(false);
  const [referralMessage, setReferralMessage] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralAccountDiscount, setReferralAccountDiscount] = useState("0");
  const [referralMlRunDiscount, setReferralMlRunDiscount] = useState("0");
  const [referralDurationDays, setReferralDurationDays] = useState("30");
  const [referralActive, setReferralActive] = useState(true);
  const [signupSearchQuery, setSignupSearchQuery] = useState("");
  const [signupFilter, setSignupFilter] = useState<"all" | GroupedAdminSignupItem["sourceTypes"][number]>("all");
  const [signupReviewFilter, setSignupReviewFilter] = useState<"all" | GroupedAdminSignupItem["reviewStatus"]>("all");
  const [signupTrendPeriod, setSignupTrendPeriod] = useState<"30d" | "3m" | "6m" | "1y" | "all">("6m");
  const [signupActionPendingEmail, setSignupActionPendingEmail] = useState<string | null>(null);
  const [showInviteStaff, setShowInviteStaff] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteAccessLevel, setInviteAccessLevel] = useState<"admin" | "super_admin">("admin");
  const [showCreateTestTrader, setShowCreateTestTrader] = useState(false);
  const [testTraderEmail, setTestTraderEmail] = useState("");
  const [testTraderPassword, setTestTraderPassword] = useState("");
  const [testTraderFullName, setTestTraderFullName] = useState("");
  const [testTraderMtUsername, setTestTraderMtUsername] = useState("");
  const [testTraderBrokerName, setTestTraderBrokerName] = useState("");
  const [testTraderMessage, setTestTraderMessage] = useState<string | null>(null);
  const [testTraderError, setTestTraderError] = useState<string | null>(null);
  const [testTraderSubmitting, setTestTraderSubmitting] = useState(false);
  const [testTraderActionError, setTestTraderActionError] = useState<string | null>(null);
  const [testTraderActionPendingId, setTestTraderActionPendingId] = useState<string | null>(null);
  const [adminActionMessage, setAdminActionMessage] = useState<string | null>(null);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminActionPendingId, setAdminActionPendingId] = useState<string | null>(null);
  const [openAdminActionMenuId, setOpenAdminActionMenuId] = useState<string | null>(null);
  const [openTestTraderActionMenuId, setOpenTestTraderActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentAdminIsSuperAdmin && inviteAccessLevel === "super_admin") {
      setInviteAccessLevel("admin");
    }
  }, [currentAdminIsSuperAdmin, inviteAccessLevel]);

  const loadAdminData = async (isMounted = true) => {
    try {
      const [traderResponse, staffResponse, churnResponse, deletionAuditResponse, signupResponse, financeResponse, referralResponse] = await Promise.all([
        fetchAdminTraders(),
        fetchAdminStaff(),
        fetchAdminChurnFeedback(),
        fetchAdminAccountDeletionAudits(),
        fetchAdminSignups(),
        fetchAdminFinance(),
        fetchAdminReferralCodes(),
      ]);
      if (!isMounted) return;
      setTraders(traderResponse.items);
      setStaffMembers(staffResponse.items);
      setChurnItems(churnResponse.items);
      setChurnSummary(churnResponse.summary);
      setDeletionAudits(deletionAuditResponse.items);
      setSignupItems(signupResponse.items);
      setSignupSummary(signupResponse.summary);
      setFinanceData(financeResponse.finance);
      setReferralCodes(referralResponse.items);
      setTradersError(null);
      setStaffError(null);
      setChurnError(null);
      setDeletionAuditError(null);
      setSignupError(null);
      setFinanceError(null);
      setReferralError(null);
    } catch (error) {
      if (!isMounted) return;
      setTraders([]);
      setStaffMembers([]);
      setChurnItems([]);
      setChurnSummary([]);
      setDeletionAudits([]);
      setSignupItems([]);
      setSignupSummary({
        totalUniqueEmails: 0,
        validUniqueEmails: 0,
        contactableUniqueEmails: 0,
        suspectUniqueEmails: 0,
        invalidUniqueEmails: 0,
        landingSignupCount: 0,
        investorSignupCount: 0,
        traderApplicationSignupCount: 0,
        traderAccountSignupCount: 0,
      });
      setFinanceData(null);
      setReferralCodes([]);
      setTradersError(error instanceof Error ? error.message : "Unable to load trader accounts.");
      setStaffError(error instanceof Error ? error.message : "Unable to load staff members.");
      setChurnError(error instanceof Error ? error.message : "Unable to load churn feedback.");
      setDeletionAuditError(error instanceof Error ? error.message : "Unable to load account deletion audits.");
      setSignupError(error instanceof Error ? error.message : "Unable to load signups.");
      setFinanceError(error instanceof Error ? error.message : "Unable to load finance data.");
      setReferralError(error instanceof Error ? error.message : "Unable to load referral codes.");
    } finally {
      if (isMounted) {
        setTradersLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadAdminData(isMounted);
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate stats
  const accountTraders = traders.filter((trader) => trader.hasAccount);
  const totalHistoryExports = accountTraders.reduce((sum, trader) => sum + trader.historyExportCount, 0);
  const totalAnalysisRuns = accountTraders.reduce((sum, trader) => sum + trader.analysisRunCount, 0);
  const totalTraders = accountTraders.length;
  const activeTraders = accountTraders.filter((trader) => trader.accountStatus === "ACTIVE").length;
  const premiumCount = accountTraders.filter((trader) => trader.plan === "premium").length;
  const paygCount = accountTraders.filter((trader) => trader.plan === "payg").length;
  const activeEaConnections = accountTraders.filter((trader) => trader.lastEaSyncAt !== null).length;
  const deletedAccountsCount = deletionAudits.length;
  const displayTotalUsers = totalTraders;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const displayNewUsers = accountTraders.filter((trader) => {
    const joinedAt = new Date(trader.joinedAt);
    return joinedAt.getMonth() === currentMonth && joinedAt.getFullYear() === currentYear;
  }).length;
  const deletedThisMonth = deletionAudits.filter((audit) => {
    const deletedAt = new Date(audit.deletedAt);
    return deletedAt.getMonth() === currentMonth && deletedAt.getFullYear() === currentYear;
  }).length;
  const tradersWithApiKeys = accountTraders.filter((trader) => trader.apiKeysCount > 0).length;
  const userGrowthTrend = Array.from({ length: 5 }, (_, index) => {
    const monthDate = new Date(currentYear, currentMonth - (4 - index), 1);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const label = monthDate.toLocaleDateString(undefined, { month: "short" });
    const createdAccounts = accountTraders.filter((trader) => {
      const joinedAt = new Date(trader.joinedAt);
      return joinedAt >= monthDate && joinedAt < nextMonth;
    }).length;
    const deletedAccounts = deletionAudits.filter((audit) => {
      const deletedAt = new Date(audit.deletedAt);
      return deletedAt >= monthDate && deletedAt < nextMonth;
    }).length;
    const currentAccounts = accountTraders.filter((trader) => {
      const joinedAt = new Date(trader.joinedAt);
      return (
        joinedAt.getFullYear() < monthDate.getFullYear() ||
        (joinedAt.getFullYear() === monthDate.getFullYear() &&
          joinedAt.getMonth() <= monthDate.getMonth())
      );
    }).length;
    return { month: label, createdAccounts, deletedAccounts, currentAccounts };
  });

  const activityChartData = Array.from({ length: 5 }, (_, index) => {
    const monthDate = new Date(currentYear, currentMonth - (4 - index), 1);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const label = monthDate.toLocaleDateString(undefined, { month: "short" });
    const newAccounts = accountTraders.filter((trader) => {
      const joinedAt = new Date(trader.joinedAt);
      return joinedAt >= monthDate && joinedAt < nextMonth;
    }).length;
    return { month: label, accounts: newAccounts };
  });

  const churnTrendData = Array.from({ length: 5 }, (_, index) => {
    const monthDate = new Date(currentYear, currentMonth - (4 - index), 1);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const label = monthDate.toLocaleDateString(undefined, { month: "short" });
    const count = churnItems.filter((item) => {
      const createdAt = new Date(item.createdAt);
      return createdAt >= monthDate && createdAt < nextMonth;
    }).length;
    return { month: label, count };
  });

  const totalCancellations = churnItems.length;
  const churnRate = displayTotalUsers > 0
    ? ((totalCancellations / displayTotalUsers) * 100).toFixed(1)
    : "0.0";
  const recentRecords = churnItems.slice(0, 8);
  const financeSummary = financeData?.summary ?? {
    traderAccounts: 0,
    paygAccounts: 0,
    premiumAccounts: 0,
    stripeCustomers: 0,
    activeSubscriptions: 0,
    paidSubscriptionInvoices: 0,
    recognizedSubscriptionRevenue: 0,
    completedAnalysisRuns: 0,
    estimatedAnalysisRevenue: 0,
    totalRecognizedRevenue: 0,
    averageRevenuePerRun: 0,
  };
  const financeMonthlyRevenue = financeData?.monthlyRevenue ?? [];
  const financeAccounts = financeData?.accounts ?? [];
  const adminStaffMembers = staffMembers.filter((staff) => staff.role === "admin" || staff.role === "super_admin");
  const testTraderStaffMembers = staffMembers.filter((staff) => staff.role === "test_trader");

  const formatCurrency = (value: number) =>
    `£${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatPercent = (value: number) => `${value.toFixed(0)}%`;

  // Filter and sort traders
  let filteredTraders = accountTraders.filter(trader => 
    trader.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    trader.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (trader.country || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply sorting based on filter
  if (traderFilter === "most-exports") {
    filteredTraders = [...filteredTraders].sort((a, b) => b.historyExportCount - a.historyExportCount);
  } else if (traderFilter === "most-trades") {
    filteredTraders = [...filteredTraders].sort((a, b) => b.tradeEventCount - a.tradeEventCount);
  } else if (traderFilter === "needs-analysis") {
    filteredTraders = [...filteredTraders].sort((a, b) => {
      const priority = {
        NEEDS_ANALYSIS: 0,
        NO_TRADE_DATA: 1,
        ANALYSIS_READY: 2,
      } as const;

      if (priority[a.analysisStatus] === priority[b.analysisStatus]) {
        return b.tradeEventCount - a.tradeEventCount;
      }

      return priority[a.analysisStatus] - priority[b.analysisStatus];
    });
  }

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE" || status === "active") {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>;
    }
    if (status === "PENDING") {
      return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Pending</span>;
    }
    if (status === "DISABLED" || status === "inactive") {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Disabled</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">No account</span>;
  };

  const getPlanBadge = (plan: string) => {
    return plan === "premium" 
      ? <span className="px-2 py-1 text-xs rounded-full bg-teal-100 text-teal-700">Premium</span>
      : <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">PAYG</span>;
  };

  const formatDate = (value: string | null) => {
    if (!value) return "Never";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-red-100 text-red-700",
      super_admin: "bg-purple-100 text-purple-700",
      test_trader: "bg-teal-100 text-teal-700",
    };
    const label =
      role === "test_trader"
        ? "Test Trader"
        : role === "super_admin"
          ? "Super Admin"
          : "Admin";
    return <span className={`px-2 py-1 text-xs rounded-full ${roleColors[role as keyof typeof roleColors]}`}>{label}</span>;
  };

  const getSignupSourceLabel = (sourceType: GroupedAdminSignupItem["sourceTypes"][number]) => {
    if (sourceType === "landing_waitlist") return "Landing Page";
    if (sourceType === "investor_waitlist") return "Investor Signup";
    if (sourceType === "trader_application") return "Trader Application";
    return "Trader Account";
  };

  const getSignupSourceBadge = (sourceType: GroupedAdminSignupItem["sourceTypes"][number]) => {
    const tones = {
      landing_waitlist: "bg-blue-100 text-blue-700",
      investor_waitlist: "bg-cyan-100 text-cyan-700",
      trader_application: "bg-amber-100 text-amber-700",
      trader_account: "bg-teal-100 text-teal-700",
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${tones[sourceType]}`}>
        {getSignupSourceLabel(sourceType)}
      </span>
    );
  };

  const hasAdminActions = (staff: AdminStaffMember) =>
    Boolean(
      staff.billingExemptReason ||
      (currentAdminIsSuperAdmin && staff.role === "admin") ||
      (currentAdminIsSuperAdmin && staff.source !== "environment")
    );

  const getAnalysisStatusBadge = (status: AdminTrader["analysisStatus"]) => {
    if (status === "ANALYSIS_READY") {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Analysis Ready</span>;
    }
    if (status === "NEEDS_ANALYSIS") {
      return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Needs Analysis</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">No Trade Data</span>;
  };

  const isSignupValid = (item: GroupedAdminSignupItem) =>
    item.reviewStatus === "ACTIVE" && !item.doNotContact;

  const getSignupReviewBadge = (item: GroupedAdminSignupItem) => {
    if (!isSignupValid(item)) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Not Valid</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Valid</span>;
  };

  const getSignupTrendConfig = (period: typeof signupTrendPeriod) => {
    if (period === "30d") {
      return {
        start: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
        stepDays: 1,
        labelOptions: { month: "short", day: "numeric" } as const,
      };
    }
    if (period === "3m") {
      return {
        start: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000),
        stepDays: 7,
        labelOptions: { month: "short", day: "numeric" } as const,
      };
    }
    if (period === "6m") {
      return {
        start: new Date(Date.now() - 181 * 24 * 60 * 60 * 1000),
        stepDays: 7,
        labelOptions: { month: "short", day: "numeric" } as const,
      };
    }
    if (period === "1y") {
      return {
        start: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
        stepDays: 30,
        labelOptions: { month: "short", year: "2-digit" } as const,
      };
    }
    return {
      start: null as Date | null,
      stepDays: 30,
      labelOptions: { month: "short", year: "2-digit" } as const,
    };
  };

  const filteredSignupItems = signupItems.filter((item) => {
    const matchesFilter = signupFilter === "all" || item.sourceTypes.includes(signupFilter);
    const matchesReviewFilter =
      signupReviewFilter === "all" ||
      (signupReviewFilter === "ACTIVE" && isSignupValid(item)) ||
      (signupReviewFilter === "INVALID" && !isSignupValid(item));
    const query = signupSearchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.email.toLowerCase().includes(query) ||
      (item.name || "").toLowerCase().includes(query) ||
      item.details.some((detail) => detail.toLowerCase().includes(query)) ||
      item.sourceTypes.some((sourceType) => getSignupSourceLabel(sourceType).toLowerCase().includes(query)) ||
      (isSignupValid(item) ? "valid" : "not valid").includes(query);

    return matchesFilter && matchesReviewFilter && matchesSearch;
  });

  const signupTrendData = useMemo(() => {
    const config = getSignupTrendConfig(signupTrendPeriod);
    const datedItems = filteredSignupItems
      .map((item) => ({
        item,
        date: new Date(item.submittedAt),
      }))
      .filter(({ date }) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (datedItems.length === 0) {
      return [];
    }

    const rawStart = config.start ? new Date(config.start) : new Date(datedItems[0].date);
    rawStart.setHours(0, 0, 0, 0);

    const rawEnd = new Date();
    rawEnd.setHours(23, 59, 59, 999);

    const bucketStart = new Date(rawStart);
    const bucketMs = config.stepDays * 24 * 60 * 60 * 1000;
    const buckets = new Map<string, {
      label: string;
      valid: number;
      landing: number;
      investor: number;
      applications: number;
      accounts: number;
    }>();

    for (let cursor = bucketStart.getTime(); cursor <= rawEnd.getTime(); cursor += bucketMs) {
      const bucketDate = new Date(cursor);
      const key = bucketDate.toISOString();
      buckets.set(key, {
        label: bucketDate.toLocaleDateString(undefined, config.labelOptions),
        valid: 0,
        landing: 0,
        investor: 0,
        applications: 0,
        accounts: 0,
      });
    }

    datedItems.forEach(({ item, date }) => {
      if (date < bucketStart || date > rawEnd) {
        return;
      }
      const bucketIndex = Math.floor((date.getTime() - bucketStart.getTime()) / bucketMs);
      const key = new Date(bucketStart.getTime() + bucketIndex * bucketMs).toISOString();
      const bucket = buckets.get(key);
      if (!bucket) {
        return;
      }

      if (isSignupValid(item)) {
        bucket.valid += 1;
        if (item.sourceTypes.includes("landing_waitlist")) {
          bucket.landing += 1;
        }
        if (item.sourceTypes.includes("investor_waitlist")) {
          bucket.investor += 1;
        }
        if (item.sourceTypes.includes("trader_application")) {
          bucket.applications += 1;
        }
        if (item.sourceTypes.includes("trader_account")) {
          bucket.accounts += 1;
        }
      }
    });

    return Array.from(buckets.values());
  }, [filteredSignupItems, signupTrendPeriod]);

  const reloadSignups = async () => {
    const signupResponse = await fetchAdminSignups();
    setSignupItems(signupResponse.items);
    setSignupSummary(signupResponse.summary);
    setSignupError(null);
  };

  const reloadStaff = async () => {
    const staffResponse = await fetchAdminStaff();
    setStaffMembers(staffResponse.items);
    setStaffError(null);
  };

  const reloadTraders = async () => {
    const traderResponse = await fetchAdminTraders();
    setTraders(traderResponse.items);
    setTradersError(null);
  };

  const handleSignupReviewUpdate = async (
    item: GroupedAdminSignupItem,
    nextStatus: GroupedAdminSignupItem["reviewStatus"],
    nextDoNotContact: boolean,
  ) => {
    if (signupActionPendingEmail === item.email) return;

    const requiresReason = nextStatus === "SUSPECT" || nextStatus === "INVALID";
    const reason = requiresReason
      ? window.prompt(`Reason for marking ${item.email} as ${nextStatus.toLowerCase()}:`, item.reviewReason || "") ?? ""
      : item.reviewReason || "";
    const notes =
      window.prompt(`Optional notes for ${item.email}:`, item.reviewNotes || "") ??
      (item.reviewNotes || "");

    setSignupActionPendingEmail(item.email);
    setSignupError(null);

    try {
      await updateAdminSignupReview({
        email: item.email,
        status: nextStatus,
        doNotContact: nextDoNotContact,
        reason,
        notes,
      });
      await reloadSignups();
    } catch (error) {
      setSignupError(error instanceof Error ? error.message : "Unable to update signup review.");
    } finally {
      setSignupActionPendingEmail(null);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteSubmitting) return;

    setInviteSubmitting(true);
    setInviteMessage(null);
    setInviteError(null);

    try {
      await inviteAdmin(inviteEmail, inviteCode, inviteAccessLevel);
      await reloadStaff();
      setInviteMessage(`Invite sent for ${inviteEmail.trim().toLowerCase()} as ${inviteAccessLevel === "super_admin" ? "Super Admin" : "Admin"}. The one-time code will require a password change on first login.`);
      setInviteEmail("");
      setInviteCode("");
      setInviteAccessLevel("admin");
      setShowInviteStaff(false);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Unable to invite admin.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleCreateTestTraderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testTraderSubmitting) return;

    setTestTraderSubmitting(true);
    setTestTraderMessage(null);
    setTestTraderError(null);

    try {
      const response = await createAdminTestTrader({
        email: testTraderEmail,
        password: testTraderPassword,
        fullName: testTraderFullName || undefined,
        metaTraderUsername: testTraderMtUsername || undefined,
        brokerName: testTraderBrokerName || undefined,
      });
      await reloadTraders();
      await reloadStaff();
      const createdTrader = response.staffMember;
      setTestTraderMessage(
        `${createdTrader.email} now has trader access enabled and can sign in directly without Stripe checkout.`,
      );
      setTestTraderEmail("");
      setTestTraderPassword("");
      setTestTraderFullName("");
      setTestTraderMtUsername("");
      setTestTraderBrokerName("");
      setShowCreateTestTrader(false);
    } catch (error) {
      setTestTraderError(error instanceof Error ? error.message : "Unable to create test trader.");
    } finally {
      setTestTraderSubmitting(false);
    }
  };

  const handleToggleTestTraderAccess = async (staff: AdminStaffMember) => {
    if (staff.source !== "test_trader" || testTraderActionPendingId) return;

    const enabling = staff.status !== "ACTIVE";
    setTestTraderActionPendingId(staff.id);
    setTestTraderActionError(null);
    setTestTraderMessage(null);

    try {
      const response = await setAdminTestTraderAccess(staff.id, enabling);
      setStaffMembers((prev) =>
        prev.map((item) => (item.id === staff.id ? response.staffMember : item))
      );
      setTestTraderMessage(
        `${staff.email} ${enabling ? "enabled" : "disabled"}.`
      );
      setOpenTestTraderActionMenuId(null);
    } catch (error) {
      setTestTraderActionError(error instanceof Error ? error.message : "Unable to update test trader access.");
    } finally {
      setTestTraderActionPendingId(null);
    }
  };

  const handleToggleTraderStatus = async (trader: AdminTrader) => {
    if (trader.accountStatus === "NO_ACCOUNT") return;
    const newStatus = trader.accountStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const confirmed = window.confirm(
      `${newStatus === "DISABLED" ? "Disable" : "Enable"} account for ${trader.email}?\n\n${newStatus === "DISABLED" ? "They will be blocked from logging in." : "They will be able to log in again."}`
    );
    if (!confirmed) return;
    try {
      await updateTraderStatus(trader.id, newStatus);
      setTraders((prev) => prev.map((t) => t.id === trader.id ? { ...t, accountStatus: newStatus } : t));
    } catch (err) {
      alert(`Failed to update status: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleAdminResetPassword = async (trader: AdminTrader) => {
    const confirmed = window.confirm(`Send a password reset email to ${trader.email}?`);
    if (!confirmed) return;
    try {
      await adminResetTraderPassword(trader.id);
      alert(`✅ Password reset email sent to ${trader.email}`);
    } catch (err) {
      alert(`Failed to send reset email: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleSyncStripe = async (trader: AdminTrader) => {
    const confirmed = window.confirm(`Sync Stripe subscription for ${trader.email}?\n\nThis looks up their active subscription in Stripe and saves it to the database. Use this if they paid but still can't access the dashboard.`);
    if (!confirmed) return;
    try {
      const result = await adminSyncTraderStripe(trader.id);
      alert(`✅ Synced — subscription ${result.stripeSubscriptionId} (${result.stripeStatus}) linked to account.`);
      await reloadTraders();
    } catch (err) {
      alert(`Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleTogglePlatformComp = async (trader: AdminTrader) => {
    const enabling = !trader.platformComped;
    const confirmed = window.confirm(
      enabling
        ? `Enable complimentary platform access for ${trader.email}?\n\nThis uses the Stripe free coupon flow for account billing. ML run charges stay separate.`
        : `Remove complimentary platform access for ${trader.email}?\n\nThis will stop using the free platform-access coupon on their account.`,
    );
    if (!confirmed) return;
    try {
      await setTraderPlatformComp(trader.id, enabling);
      await reloadTraders();
      alert(`✅ ${enabling ? "Complimentary platform access enabled" : "Complimentary platform access removed"} for ${trader.email}.`);
    } catch (err) {
      alert(`Failed to update complimentary access: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleDeleteEmptyTestTrader = async (trader: AdminTrader) => {
    if (testTraderActionPendingId) return;

    const confirmed = window.confirm(
      `Remove ${trader.email} permanently?\n\nThis only works for empty internal test accounts with no stored trades, broker data, ML runs, or API keys.`,
    );
    if (!confirmed) return;

    setTestTraderActionPendingId(trader.id);
    setTestTraderActionError(null);
    setTestTraderMessage(null);

    try {
      await deleteAdminTestTrader(trader.id);
      setTraders((prev) => prev.filter((item) => item.id !== trader.id));
      setStaffMembers((prev) => prev.filter((item) => item.id !== trader.id));
      setTestTraderMessage(`${trader.email} removed.`);
      setOpenTestTraderActionMenuId(null);
    } catch (error) {
      setTestTraderActionError(error instanceof Error ? error.message : "Unable to remove test trader.");
    } finally {
      setTestTraderActionPendingId(null);
    }
  };

  const handleWipeAdminTraderSide = async (staff: AdminStaffMember) => {
    if (adminActionPendingId || staff.source === "environment") return;

    const confirmed = window.confirm(
      `Wipe trader-side data for ${staff.email}?\n\nThis keeps the admin account, but removes trader access data such as trades, broker accounts, EA data, API keys, runs, and trader billing state.`,
    );
    if (!confirmed) return;

    setAdminActionPendingId(staff.id);
    setAdminActionError(null);
    setAdminActionMessage(null);

    try {
      const response = await wipeAdminStaffTraderData(staff.id);
      setStaffMembers((prev) => prev.map((item) => (item.id === staff.id ? response.staffMember : item)));
      await reloadTraders();
      setAdminActionMessage(`${staff.email} trader-side data wiped.`);
      setOpenAdminActionMenuId(null);
    } catch (error) {
      setAdminActionError(error instanceof Error ? error.message : "Unable to wipe trader-side data.");
    } finally {
      setAdminActionPendingId(null);
    }
  };

  const handlePromoteAdmin = async (staff: AdminStaffMember) => {
    if (adminActionPendingId || staff.source === "environment" || staff.role === "super_admin") return;

    setAdminActionPendingId(staff.id);
    setAdminActionError(null);
    setAdminActionMessage(null);

    try {
      const response = await promoteAdminToSuper(staff.id);
      setStaffMembers((prev) => prev.map((item) => (item.id === staff.id ? response.staffMember : item)));
      setAdminActionMessage(`${staff.email} promoted to Super Admin.`);
      setOpenAdminActionMenuId(null);
    } catch (error) {
      setAdminActionError(error instanceof Error ? error.message : "Unable to promote admin access.");
    } finally {
      setAdminActionPendingId(null);
    }
  };

  const handleRemoveAdminAccess = async (staff: AdminStaffMember) => {
    if (adminActionPendingId || staff.source === "environment") return;

    const confirmed = window.confirm(
      `Remove admin access for ${staff.email}?\n\nIf trader access is enabled, the account will be demoted to trader-only. Otherwise the admin account will be deleted.`,
    );
    if (!confirmed) return;

    setAdminActionPendingId(staff.id);
    setAdminActionError(null);
    setAdminActionMessage(null);

    try {
      const response = await removeAdminAccess(staff.id);
      await reloadStaff();
      await reloadTraders();
      setAdminActionMessage(
        response.mode === "demoted_to_trader"
          ? `${staff.email} admin access removed and the account was kept as trader-only.`
          : `${staff.email} admin access removed.`,
      );
      setOpenAdminActionMenuId(null);
    } catch (error) {
      setAdminActionError(error instanceof Error ? error.message : "Unable to remove admin access.");
    } finally {
      setAdminActionPendingId(null);
    }
  };

  const reloadReferralCodes = async () => {
    const response = await fetchAdminReferralCodes();
    setReferralCodes(response.items);
    setReferralError(null);
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (referralSubmitting) return;

    setReferralSubmitting(true);
    setReferralMessage(null);
    setReferralError(null);

    try {
      const response = await createAdminReferralCode({
        code: referralCode,
        accountDiscountPercent: Number(referralAccountDiscount),
        mlRunDiscountPercent: Number(referralMlRunDiscount),
        durationDays: Number(referralDurationDays),
        isActive: referralActive,
      });
      await reloadReferralCodes();
      setReferralMessage(`Referral code ${response.referralCode.code} created.`);
      setReferralCode("");
      setReferralAccountDiscount("0");
      setReferralMlRunDiscount("0");
      setReferralDurationDays("30");
      setReferralActive(true);
    } catch (error) {
      setReferralError(error instanceof Error ? error.message : "Unable to create referral code.");
    } finally {
      setReferralSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl mb-1 flex items-center gap-3">
                <Shield className="w-8 h-8 text-teal-400" />
                Admin Control Panel
              </h1>
              <p className="text-slate-300">Green Turtle Trades Platform Management</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 transition-colors rounded-lg border border-white/20"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 p-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveSection("overview")}
              className={`min-w-max py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeSection === "overview"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveSection("churn")}
              className={`min-w-max py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeSection === "churn"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <UserX className="w-5 h-5" />
              <span>Churn Data</span>
            </button>
            <button
              onClick={() => setActiveSection("signups")}
              className={`min-w-max py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeSection === "signups"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Signups</span>
            </button>
            <button
              onClick={() => setActiveSection("finance")}
              className={`min-w-max py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeSection === "finance"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Finance</span>
            </button>
            <button
              onClick={() => setActiveSection("staff")}
              className={`min-w-max py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeSection === "staff"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Staff Management</span>
            </button>
            <button
              onClick={() => setActiveSection("audits")}
              className={`min-w-max py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeSection === "audits"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>Deletion Audits</span>
            </button>
            <button
              onClick={() => setActiveSection("guide")}
              className={`min-w-max py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeSection === "guide"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Technical Guide</span>
            </button>
          </div>
        </div>

        {/* OVERVIEW SECTION */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* TIME PERIOD FILTER - At the top of Overview */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg shadow-md p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg mb-1">Data Analytics Period</h3>
                  <p className="text-sm text-white/80">View platform metrics across different time ranges</p>
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value as any)}
                    className="pl-10 pr-10 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-white/30 focus:border-transparent text-sm appearance-none backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer min-w-[200px]"
                  >
                    <option value="7d" className="text-slate-900">Last 7 Days</option>
                    <option value="30d" className="text-slate-900">Last 30 Days</option>
                    <option value="3m" className="text-slate-900">Last 3 Months</option>
                    <option value="6m" className="text-slate-900">Last 6 Months</option>
                    <option value="1y" className="text-slate-900">Last Year</option>
                    <option value="all" className="text-slate-900">All Time</option>
                  </select>
                </div>
              </div>
            </div>

            {/* NEW: Platform Users Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Platform Users Overview
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Current Traders</div>
                    <div className="text-3xl text-slate-900 mb-1">{displayTotalUsers}</div>
                    <div className="text-xs text-teal-600">Non-deleted trader accounts</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">New This Month</div>
                    <div className="text-3xl text-slate-900 mb-1">{displayNewUsers}</div>
                    <div className="text-xs text-blue-600">Trader accounts created this month</div>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Deleted Accounts</div>
                    <div className="text-3xl text-slate-900 mb-1">{deletedAccountsCount}</div>
                    <div className="text-xs text-slate-600">{deletedThisMonth} deleted this month</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1 flex items-center gap-1">
                      <UserX className="w-3.5 h-3.5" />
                      Feedback Entries
                    </div>
                    <div className="text-3xl text-slate-900 mb-1">{churnItems.length}</div>
                    <div className="text-xs text-red-600">Cancellation feedback submitted</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Connected EA Accounts</div>
                    <div className="text-3xl text-slate-900 mb-1">{activeEaConnections}</div>
                    <div className="text-xs text-amber-600">Trader accounts with EA activity</div>
                  </div>
                </div>

                {/* User Growth Chart and Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h3 className="text-sm text-slate-700 mb-3">Trader Account Growth</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={userGrowthTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                          formatter={(value: number, name: string) => [
                            `${value}`,
                            name === "createdAccounts"
                              ? "Accounts created"
                              : name === "deletedAccounts"
                                ? "Accounts deleted"
                                : "Current traders",
                          ]}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="currentAccounts" name="Current Traders" stroke="#0d9488" strokeWidth={2} dot={{ fill: '#0d9488', r: 4 }} />
                        <Line type="monotone" dataKey="deletedAccounts" name="Deleted Accounts" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-sm text-slate-700 mb-3">Account Engagement</h3>
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Avg. Stored Trades per Trader</div>
                        <div className="text-xl text-slate-900">{totalTraders > 0 ? (accountTraders.reduce((sum, trader) => sum + trader.tradeEventCount, 0) / totalTraders).toFixed(0) : "0"}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Avg. Analysis Runs per Trader</div>
                        <div className="text-xl text-slate-900">{totalTraders > 0 ? (totalAnalysisRuns / totalTraders).toFixed(0) : "0"}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Premium Traders</div>
                        <div className="text-xl text-teal-600">{totalTraders > 0 ? ((premiumCount / totalTraders) * 100).toFixed(0) : "0"}%</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Current Active Traders</div>
                        <div className="text-xl text-green-600">{activeTraders}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subsection 1: ML Model Usage with Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg text-slate-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Account And EA Activity
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">History Exports</div>
                    <div className="text-3xl text-slate-900 mb-1">{totalHistoryExports.toLocaleString()}</div>
                    <div className="text-xs text-purple-600">Real HISTORY_EXPORT events</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Avg. Exports per Trader</div>
                    <div className="text-3xl text-slate-900 mb-1">{totalTraders > 0 ? (totalHistoryExports / totalTraders).toFixed(0) : "0"}</div>
                    <div className="text-xs text-slate-600">Across tracked trader records</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">API Key Coverage</div>
                    <div className="text-3xl text-slate-900 mb-1">{tradersWithApiKeys}</div>
                    <div className="text-xs text-cyan-600">Traders with API keys configured</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Connected EA Traders</div>
                    <div className="text-3xl text-slate-900 mb-1">{activeEaConnections}</div>
                    <div className="text-xs text-slate-600">Have at least one synced EA event</div>
                  </div>
                </div>

                {/* ML Usage Chart */}
                <div>
                  <h3 className="text-sm text-slate-700 mb-3">Trader Account Creation Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={activityChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value}`, 'Records']}
                      />
                      <Legend />
                      <Bar dataKey="accounts" fill="#a855f7" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Subsection 2: Trader Accounts with Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-lg text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    Trader Accounts
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search traders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-48 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="relative flex-1 sm:flex-initial">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        value={traderFilter}
                        onChange={(e) => setTraderFilter(e.target.value as any)}
                        className="w-full sm:w-48 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm appearance-none bg-white"
                      >
                        <option value="all">All Traders</option>
                        <option value="most-exports">Most Exports</option>
                        <option value="most-trades">Most Stored Trades</option>
                        <option value="needs-analysis">Needs Analysis</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="border-b border-slate-200 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-slate-600 text-xs mb-1">Total Traders</div>
                    <div className="text-2xl text-slate-900">{displayTotalUsers}</div>
                  </div>
                  <div>
                    <div className="text-slate-600 text-xs mb-1">Active Traders</div>
                    <div className="text-2xl text-green-600">{activeTraders}</div>
                  </div>
                  <div>
                    <div className="text-slate-600 text-xs mb-1">Premium</div>
                    <div className="text-2xl text-teal-600">{premiumCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-600 text-xs mb-1">PAYG</div>
                    <div className="text-2xl text-slate-900">{paygCount}</div>
                  </div>
                </div>
              </div>

              {/* Trader Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Trader</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Account</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Plan</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Analysis Status</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Country</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Broker Accounts</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Stored Trades</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Exports</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Last EA Sync</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTraders.map((trader) => (
                      <tr key={trader.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-slate-900">{trader.name}</div>
                            <div className="text-slate-600 text-xs">{trader.email}</div>
                            {trader.platformComped && (
                              <div className="mt-1 text-[11px] text-teal-700">Complimentary platform access</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(trader.accountStatus)}</td>
                        <td className="py-4 px-4">{getPlanBadge(trader.plan)}</td>
                        <td className="py-4 px-4">{getAnalysisStatusBadge(trader.analysisStatus)}</td>
                        <td className="py-4 px-4 text-slate-900">{trader.country || "-"}</td>
                        <td className="py-4 px-4 text-slate-900">{trader.brokerAccountsCount}</td>
                        <td className="py-4 px-4 text-slate-900">{trader.tradeEventCount}</td>
                        <td className="py-4 px-4 text-slate-900">{trader.historyExportCount}</td>
                        <td className="py-4 px-4 text-slate-900">{formatDate(trader.lastEaSyncAt)}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedTrader(trader)}
                              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {trader.hasAccount && (
                              <>
                                <button
                                  onClick={() => handleToggleTraderStatus(trader)}
                                  className={`p-1.5 rounded transition-colors ${trader.accountStatus === "ACTIVE" ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"}`}
                                  title={trader.accountStatus === "ACTIVE" ? "Disable account" : "Enable account"}
                                >
                                  {trader.accountStatus === "ACTIVE" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleAdminResetPassword(trader)}
                                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                                  title="Send password reset email"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleSyncStripe(trader)}
                                  className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                  title="Sync Stripe subscription (use if user paid but has no access)"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleTogglePlatformComp(trader)}
                                  className={`p-1.5 rounded transition-colors ${trader.platformComped ? "text-rose-600 hover:bg-rose-50" : "text-teal-600 hover:bg-teal-50"}`}
                                  title={trader.platformComped ? "Remove complimentary platform access" : "Enable complimentary platform access"}
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {trader.billingExempt && (
                              <button
                                type="button"
                                onClick={() => handleDeleteEmptyTestTrader(trader)}
                                disabled={testTraderActionPendingId === trader.id}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                                title="Remove empty test account"
                              >
                                {testTraderActionPendingId === trader.id ? "Removing..." : "Remove"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTraders.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">{tradersLoading ? "Loading trader accounts..." : tradersError || "No traders found"}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "finance" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg text-slate-900">Finance</h2>
              <p className="mt-1 text-sm text-slate-600">
                Subscription billing and ML usage billing are both shown from Stripe-paid invoice data, with account and run counts alongside them for operational context.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="mb-4">
                  <h3 className="text-slate-900 text-lg">Stripe-Confirmed Billing</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    These figures come directly from paid Stripe invoice events stored by the platform.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-5">
                    <div className="text-slate-600 text-sm mb-1">Platform Access Revenue</div>
                    <div className="text-3xl text-slate-900">{formatCurrency(financeSummary.recognizedSubscriptionRevenue)}</div>
                    <div className="text-xs text-slate-500 mt-1">Stripe-paid platform subscription revenue</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-5">
                    <div className="text-slate-600 text-sm mb-1">Paid Stripe Invoices</div>
                    <div className="text-3xl text-slate-900">{financeSummary.paidSubscriptionInvoices}</div>
                    <div className="text-xs text-slate-500 mt-1">Confirmed by stored invoice.paid events</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-5">
                    <div className="text-slate-600 text-sm mb-1">Stripe Customers Linked</div>
                    <div className="text-3xl text-slate-900">{financeSummary.stripeCustomers}</div>
                    <div className="text-xs text-slate-500 mt-1">Users with a Stripe customer record linked</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-5">
                    <div className="text-slate-600 text-sm mb-1">Subscription Links</div>
                    <div className="text-3xl text-slate-900">{financeSummary.activeSubscriptions}</div>
                    <div className="text-xs text-slate-500 mt-1">Users with a stored Stripe subscription link</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="mb-4">
                  <h3 className="text-slate-900 text-lg">Stripe-Confirmed ML Billing</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    These figures come from Stripe-paid metered ML usage on trader subscription invoices.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-5">
                    <div className="text-slate-600 text-sm mb-1">ML Usage Revenue</div>
                    <div className="text-3xl text-slate-900">{formatCurrency(financeSummary.estimatedAnalysisRevenue)}</div>
                    <div className="text-xs text-slate-500 mt-1">Stripe-paid metered ML usage</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-5">
                    <div className="text-slate-600 text-sm mb-1">Completed Analysis Runs</div>
                    <div className="text-3xl text-slate-900">{financeSummary.completedAnalysisRuns}</div>
                    <div className="text-xs text-slate-500 mt-1">Completed runs recorded in the platform</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-5">
                    <div className="text-slate-600 text-sm mb-1">Average Revenue per ML Run</div>
                    <div className="text-3xl text-slate-900">{formatCurrency(financeSummary.averageRevenuePerRun)}</div>
                    <div className="text-xs text-slate-500 mt-1">Average paid Stripe revenue across completed runs</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-5">
                    <div className="text-slate-600 text-sm mb-1">Stripe Cash Received</div>
                    <div className="text-3xl text-slate-900">{formatCurrency(financeSummary.totalRecognizedRevenue)}</div>
                    <div className="text-xs text-slate-500 mt-1">Platform access plus ML usage actually paid in Stripe</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <div className="text-slate-600 text-sm mb-1">Trader Accounts</div>
                <div className="text-3xl text-slate-900">{financeSummary.traderAccounts}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <div className="text-slate-600 text-sm mb-1">Subscribed Accounts</div>
                <div className="text-3xl text-slate-900">{financeSummary.premiumAccounts}</div>
                <div className="text-xs text-slate-500 mt-1">Accounts with a linked Stripe subscription</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <div className="text-slate-600 text-sm mb-1">Not Yet Subscribed</div>
                <div className="text-3xl text-slate-900">{Math.max(financeSummary.traderAccounts - financeSummary.premiumAccounts, 0)}</div>
                <div className="text-xs text-slate-500 mt-1">Accounts without a linked Stripe subscription</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                <h3 className="text-slate-900 text-lg mb-4">Stripe Revenue by Month</h3>
                <p className="mb-4 text-sm text-slate-600">
                  Teal bars are Stripe-paid subscription revenue. Dark bars are Stripe-paid ML revenue.
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financeMonthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                      formatter={(value: number, name: string) => {
                        if (name === "subscriptionRevenue") return [formatCurrency(value), "Platform Access Revenue"];
                        if (name === "analysisRevenue") return [formatCurrency(value), "ML Run Revenue"];
                        if (name === "revenue") return [formatCurrency(value), "Total Revenue"];
                        if (name === "runs") return [`${value}`, "Completed Runs"];
                        return [`${value}`, "Paid Invoices"];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="subscriptionRevenue" stackId="revenue" fill="#0d9488" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="analysisRevenue" stackId="revenue" fill="#0f172a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h3 className="text-slate-900 text-lg flex items-center gap-2">
                  <PoundSterling className="w-5 h-5 text-teal-600" />
                  Accounts and Billing Linkage
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Both platform access and ML billing columns now reflect Stripe-linked billing records and paid Stripe invoice revenue.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Trader</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Subscription State</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Stripe Customer</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Subscription Link</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Stripe Paid Invoices</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Stripe Paid Revenue</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Completed ML Runs</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Stripe ML Revenue</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Stripe Total</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Latest Stripe Payment</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Latest ML Run</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeAccounts.map((account) => (
                      <tr key={account.userId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-slate-900">{account.name}</div>
                            <div className="text-slate-600 text-xs">{account.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${account.plan === "premium" ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-700"}`}>
                            {account.plan === "premium" ? "Subscribed" : "Not subscribed"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{account.stripeCustomerLinked ? "Linked" : "Not linked"}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{account.stripeSubscriptionLinked ? "Active link" : "No link"}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{account.paidSubscriptionInvoices}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatCurrency(account.subscriptionRevenue)}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{account.completedRuns}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatCurrency(account.estimatedRevenue)}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatCurrency(account.totalRevenue)}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatDate(account.latestPaymentAt)}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatDate(account.latestRunAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {financeAccounts.length === 0 && (
                <div className="p-6 text-sm text-slate-600">{financeError || "No finance-linked trader accounts found yet."}</div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h3 className="text-slate-900 text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-teal-600" />
                  Referral Codes
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Create account-access and ML-run discount codes with a fixed duration.
                </p>
              </div>
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <form onSubmit={handleReferralSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">Code</label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      placeholder="SEAN20"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">Account Discount</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={referralAccountDiscount}
                      onChange={(e) => setReferralAccountDiscount(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">ML Run Discount</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={referralMlRunDiscount}
                      onChange={(e) => setReferralMlRunDiscount(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      step="1"
                      value={referralDurationDays}
                      onChange={(e) => setReferralDurationDays(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div className="flex flex-col justify-end gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={referralActive}
                        onChange={(e) => setReferralActive(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      Active on creation
                    </label>
                    <button
                      type="submit"
                      disabled={referralSubmitting}
                      className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {referralSubmitting ? "Creating..." : "Create Referral Code"}
                    </button>
                  </div>
                </form>
                {referralMessage && <p className="mt-3 text-sm text-green-700">{referralMessage}</p>}
                {referralError && <p className="mt-3 text-sm text-red-700">{referralError}</p>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Code</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Account Discount</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">ML Run Discount</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Duration</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Created By</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralCodes.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 text-slate-900 font-medium">{item.code}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatPercent(item.accountDiscountPercent)}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatPercent(item.mlRunDiscountPercent)}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{item.durationDays} days</td>
                        <td className="py-4 px-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${item.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                            {item.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{item.createdBy?.name || item.createdBy?.email || "Env admin"}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {referralCodes.length === 0 && (
                <div className="p-6 text-sm text-slate-600">{referralError || "No referral codes created yet."}</div>
              )}
            </div>
          </div>
        )}

        {/* STAFF MANAGEMENT SECTION */}
        {activeSection === "staff" && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg text-slate-900">Staff Management</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setShowCreateTestTrader((current) => !current);
                      setTestTraderMessage(null);
                      setTestTraderError(null);
                    }}
                    className="flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm text-teal-700 transition-colors hover:bg-teal-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create Test Trader
                  </button>
                  <button
                    onClick={() => {
                      setShowInviteStaff((current) => !current);
                      setInviteMessage(null);
                      setInviteError(null);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm text-white transition-colors hover:bg-teal-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Admin
                  </button>
                </div>
              </div>
            </div>

            {showCreateTestTrader && (
              <div className="border-b border-slate-200 bg-teal-50/40 p-4">
                <div className="mb-4">
                  <h3 className="text-base text-slate-900">Create Internal Test Trader</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Test traders created here are billing-exempt and can sign in directly without Stripe checkout.
                  </p>
                </div>
                <form onSubmit={handleCreateTestTraderSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">Email</label>
                    <input
                      type="email"
                      value={testTraderEmail}
                      onChange={(e) => setTestTraderEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      placeholder="tester@greenturtletrades.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">Password</label>
                    <input
                      type="password"
                      value={testTraderPassword}
                      onChange={(e) => setTestTraderPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">Full Name</label>
                    <input
                      type="text"
                      value={testTraderFullName}
                      onChange={(e) => setTestTraderFullName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      placeholder="Green Turtle Test"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">MetaTrader ID</label>
                    <input
                      type="text"
                      value={testTraderMtUsername}
                      onChange={(e) => setTestTraderMtUsername(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">Broker Name</label>
                    <input
                      type="text"
                      value={testTraderBrokerName}
                      onChange={(e) => setTestTraderBrokerName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      disabled={testTraderSubmitting}
                      className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {testTraderSubmitting ? "Creating..." : "Create Test Trader"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateTestTrader(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                {testTraderMessage && <p className="mt-3 text-sm text-green-700">{testTraderMessage}</p>}
                {testTraderError && <p className="mt-3 text-sm text-red-700">{testTraderError}</p>}
              </div>
            )}

            {showInviteStaff && (
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">Invite Email</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      placeholder="new.admin@greenturtletrades.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">One-Time Code</label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                      placeholder="TempCode123!"
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-700">Access Level</label>
                    <select
                      value={inviteAccessLevel}
                      onChange={(e) => setInviteAccessLevel(e.target.value as "admin" | "super_admin")}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="admin">Admin</option>
                      {currentAdminIsSuperAdmin && <option value="super_admin">Super Admin</option>}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      disabled={inviteSubmitting}
                      className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {inviteSubmitting ? "Sending..." : "Send Invite"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteStaff(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
                {inviteMessage && <p className="mt-3 text-sm text-green-700">{inviteMessage}</p>}
                {inviteError && <p className="mt-3 text-sm text-red-700">{inviteError}</p>}
              </div>
            )}

            {(testTraderMessage || testTraderActionError) && (
              <div className="border-b border-slate-200 px-4 py-3">
                {testTraderMessage && <p className="text-sm text-green-700">{testTraderMessage}</p>}
                {testTraderActionError && <p className="text-sm text-red-700">{testTraderActionError}</p>}
              </div>
            )}

            {(adminActionMessage || adminActionError) && (
              <div className="border-b border-slate-200 px-4 py-3">
                {adminActionMessage && <p className="text-sm text-green-700">{adminActionMessage}</p>}
                {adminActionError && <p className="text-sm text-red-700">{adminActionError}</p>}
              </div>
            )}

            {/* Staff Table */}
            <div className="border-t border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-3">
                <h3 className="text-sm text-slate-900">Admin Accounts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Staff Member</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Role</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Join Date</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Last Active</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminStaffMembers.map((staff) => (
                      <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-slate-900">{staff.name}</div>
                            {!staff.email.endsWith("@deleted.local") && (
                              <div className="text-slate-600 text-xs">{staff.email}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">{getRoleBadge(staff.role)}</td>
                        <td className="py-4 px-4">{getStatusBadge(staff.status)}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatDate(staff.joinDate)}</td>
                        <td className="py-4 px-4 text-slate-600 text-sm">{formatDate(staff.lastActive)}</td>
                        <td className="py-4 px-4">
                          <div className="relative flex flex-col items-start gap-2">
                            <span className="text-xs text-slate-500">
                              {staff.source === "environment" ? "Env admin" : "Database admin"}
                            </span>
                            {staff.billingExemptReason && (
                              <span className="rounded-full bg-teal-50 px-2 py-1 text-xs text-teal-700">
                                Trader access enabled
                              </span>
                            )}
                            {hasAdminActions(staff) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenAdminActionMenuId((current) => (current === staff.id ? null : staff.id))
                                }
                                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100"
                              >
                                Actions
                              </button>
                            )}
                            {hasAdminActions(staff) && openAdminActionMenuId === staff.id && (
                              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                                {staff.billingExemptReason && (
                                  <button
                                    type="button"
                                    onClick={() => handleWipeAdminTraderSide(staff)}
                                    disabled={adminActionPendingId === staff.id || staff.source === "environment"}
                                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    {adminActionPendingId === staff.id ? "Working..." : "Delete Trader Account"}
                                  </button>
                                )}
                                {currentAdminIsSuperAdmin && staff.role === "admin" && (
                                  <button
                                    type="button"
                                    onClick={() => handlePromoteAdmin(staff)}
                                    disabled={adminActionPendingId === staff.id || staff.source === "environment"}
                                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-purple-700 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    {adminActionPendingId === staff.id ? "Working..." : "Promote Admin Access"}
                                  </button>
                                )}
                                {currentAdminIsSuperAdmin && staff.source !== "environment" && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAdminAccess(staff)}
                                    disabled={adminActionPendingId === staff.id}
                                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    {adminActionPendingId === staff.id ? "Working..." : "Delete Admin Access"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {adminStaffMembers.length === 0 && (
                <div className="p-6 text-sm text-slate-600">No admin staff records found.</div>
              )}
            </div>

            <div className="border-t border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-3">
                <h3 className="text-sm text-slate-900">Test Traders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Trader</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Role</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Join Date</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Last Active</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testTraderStaffMembers.map((staff) => (
                      <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-slate-900">{staff.name}</div>
                            <div className="text-slate-600 text-xs">{staff.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">{getRoleBadge(staff.role)}</td>
                        <td className="py-4 px-4">{getStatusBadge(staff.status)}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatDate(staff.joinDate)}</td>
                        <td className="py-4 px-4 text-slate-600 text-sm">{formatDate(staff.lastActive)}</td>
                        <td className="py-4 px-4">
                          <div className="relative flex flex-col items-start gap-2">
                            <span className="text-xs text-slate-500">
                              {staff.billingExemptReason || "Billing-exempt internal test account"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenTestTraderActionMenuId((current) => (current === staff.id ? null : staff.id))
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              Actions
                            </button>
                            {openTestTraderActionMenuId === staff.id && (
                              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTestTraderAccess(staff)}
                                  disabled={testTraderActionPendingId === staff.id}
                                  className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                    staff.status === "ACTIVE"
                                      ? "text-red-700 hover:bg-red-50"
                                      : "text-green-700 hover:bg-green-50"
                                  } disabled:cursor-not-allowed disabled:opacity-70`}
                                >
                                  {testTraderActionPendingId === staff.id
                                    ? "Working..."
                                    : staff.status === "ACTIVE"
                                      ? "Disable Login"
                                      : "Enable Login"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const linkedTrader = traders.find((item) => item.id === staff.id);
                                    if (linkedTrader) {
                                      void handleDeleteEmptyTestTrader(linkedTrader);
                                    }
                                  }}
                                  disabled={testTraderActionPendingId === staff.id}
                                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {testTraderActionPendingId === staff.id ? "Working..." : "Delete Account"}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {testTraderStaffMembers.length === 0 && (
                <div className="p-6 text-sm text-slate-600">No internal test traders created yet.</div>
              )}
            </div>

            <div className="bg-amber-50 border-t border-amber-200 p-3">
              <p className="text-amber-800 text-xs">
                <strong>Note:</strong> Invited admins are real `ADMIN` users with a one-time code. Billing-exempt test traders also appear here so their access can be disabled or restored directly.
              </p>
            </div>
            {staffMembers.length === 0 && (
              <div className="p-6 text-sm text-slate-600">{staffError || "No admin or test staff records found."}</div>
            )}
          </div>
        )}

        {/* SIGNUPS SECTION */}
        {activeSection === "signups" && (
          <div className="space-y-6">
            {(() => {
              const binaryValidCount = signupItems.filter(isSignupValid).length;
              const binaryInvalidCount = signupItems.length - binaryValidCount;
              return (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-600">Total Signups</div>
                  <div className="mt-1 text-3xl text-slate-900">{binaryValidCount}</div>
                  <div className="text-xs text-slate-600">All signups currently marked valid</div>
                </div>
                <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                  <div className="text-sm text-slate-600">Investor Signups</div>
                  <div className="mt-1 text-3xl text-slate-900">{signupSummary.investorSignupCount}</div>
                  <div className="text-xs text-cyan-700">Valid investor emails</div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm text-slate-600">Trader Applications</div>
                  <div className="mt-1 text-3xl text-slate-900">{signupSummary.traderApplicationSignupCount}</div>
                  <div className="text-xs text-amber-700">Valid applicant emails</div>
                </div>
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                  <div className="text-sm text-slate-600">Trader Accounts</div>
                  <div className="mt-1 text-3xl text-slate-900">{signupSummary.traderAccountSignupCount}</div>
                  <div className="text-xs text-teal-700">Valid trader accounts created</div>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <div className="text-sm text-slate-600">Not Valid Emails</div>
                  <div className="mt-1 text-3xl text-slate-900">{binaryInvalidCount}</div>
                  <div className="text-xs text-rose-700">Includes suspect, invalid, and blocked signups</div>
                </div>
              </div>
            </div>
              );
            })()}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg text-slate-900">Signup Trend</h2>
                    <p className="text-sm text-slate-600">
                      Unique signup records over time, using the current signup filters.
                    </p>
                  </div>
                  <select
                    value={signupTrendPeriod}
                    onChange={(e) => setSignupTrendPeriod(e.target.value as typeof signupTrendPeriod)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="30d">Last 30 Days</option>
                    <option value="3m">Last 3 Months</option>
                    <option value="6m">Last 6 Months</option>
                    <option value="1y">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
              <div className="p-6">
                {signupTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={signupTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" stroke="#64748b" style={{ fontSize: "12px" }} />
                      <YAxis stroke="#64748b" style={{ fontSize: "12px" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="valid" name="Total valid" stroke="#0f172a" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="investor" name="Investor" stroke="#0891b2" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="applications" name="Applications" stroke="#d97706" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="accounts" name="Trader accounts" stroke="#0d9488" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
                    No signup trend data is available for the current filters yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <h2 className="text-lg text-slate-900">Grouped Signups</h2>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={signupSearchQuery}
                        onChange={(e) => setSignupSearchQuery(e.target.value)}
                        placeholder="Search email, name, source, or detail..."
                        className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500 sm:w-72"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={signupFilter}
                        onChange={(e) => setSignupFilter(e.target.value as typeof signupFilter)}
                        className="w-full appearance-none rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500 sm:w-56"
                      >
                        <option value="all">All Signup Types</option>
                        <option value="landing_waitlist">Landing Page</option>
                        <option value="investor_waitlist">Investor Signup</option>
                        <option value="trader_application">Trader Application</option>
                        <option value="trader_account">Trader Account</option>
                      </select>
                    </div>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <select
                        value={signupReviewFilter}
                        onChange={(e) => setSignupReviewFilter(e.target.value as typeof signupReviewFilter)}
                        className="w-full appearance-none rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500 sm:w-48"
                      >
                        <option value="all">All Review States</option>
                        <option value="ACTIVE">Valid</option>
                        <option value="INVALID">Not Valid</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-1">Raw: {signupSummary.totalUniqueEmails}</span>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">Valid: {signupItems.filter(isSignupValid).length}</span>
                  <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">Not Valid: {signupItems.filter((item) => !isSignupValid(item)).length}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Sources</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Name</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Email</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Entries</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Review</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Statuses</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Details</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Actions</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Latest Signup</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSignupItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            {item.sourceTypes.map((sourceType) => (
                              <span key={`${item.id}-${sourceType}`}>{getSignupSourceBadge(sourceType)}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-900">{item.name || "-"}</td>
                        <td className="py-4 px-4 text-slate-600 text-sm">{item.email}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{item.entryCount}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                              {getSignupReviewBadge(item)}
                            </div>
                            {(item.reviewReason || item.reviewNotes) && (
                              <div className="text-xs text-slate-500">
                                {[item.reviewReason, item.reviewNotes].filter(Boolean).join(" | ")}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            {item.statuses.map((status) => (
                              <span key={`${item.id}-${status}`} className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                                {status}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-sm">
                          {item.details.length > 0 ? item.details.join(" | ") : "-"}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={signupActionPendingEmail === item.email}
                              onClick={() => handleSignupReviewUpdate(item, "ACTIVE", false)}
                              className="rounded-full border border-green-200 px-3 py-1 text-xs text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Valid
                            </button>
                            <button
                              type="button"
                              disabled={signupActionPendingEmail === item.email}
                              onClick={() => handleSignupReviewUpdate(item, "INVALID", true)}
                              className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Not Valid
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatDate(item.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredSignupItems.length === 0 && (
                <div className="p-6 text-sm text-slate-600">
                  {signupError || "No signup records match the current filters."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FEEDBACK AND CHURN SECTION */}
        {activeSection === "churn" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg text-slate-900">Churn Data</h2>
              <p className="mt-1 text-sm text-slate-600">
                Live cancellation reasons, churn trend, and account-exit feedback from platform users.
              </p>
            </div>

            {/* Churn Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm">Total Cancellations</span>
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-slate-900 text-3xl mb-1">{totalCancellations}</div>
                <div className="text-slate-500 text-xs">Live cancellation submissions</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm">Churn Rate</span>
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-slate-900 text-3xl mb-1">{churnRate}%</div>
                <div className="text-slate-500 text-xs">Cancellations vs current tracked users</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm">Top Reason</span>
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-slate-900 text-xl mb-1">
                  {churnSummary[0]?.reason?.replaceAll("-", " ") || "No data yet"}
                </div>
                <div className="text-slate-500 text-xs">
                  {churnSummary[0] ? `${churnSummary[0].count} submissions` : "Awaiting cancellation feedback"}
                </div>
              </div>
            </div>

            {/* Cancellation Reasons Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-slate-900 text-lg mb-4">Cancellation Reasons Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={churnSummary.map((item) => ({ label: item.reason.replaceAll("-", " "), count: item.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value} cancellations`, "Count"]}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Churn Trend */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-slate-900 text-lg mb-4">Cancellation Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={churnTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} name="Cancellations" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Feedback */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h3 className="text-slate-900 text-lg">Recent Cancellation Feedback</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-600 text-sm">User</th>
                      <th className="text-left py-3 px-4 text-slate-600 text-sm">Plan</th>
                      <th className="text-left py-3 px-4 text-slate-600 text-sm">Reason</th>
                      <th className="text-left py-3 px-4 text-slate-600 text-sm">Date</th>
                      <th className="text-left py-3 px-4 text-slate-600 text-sm">Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRecords.map((record) => (
                      <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="text-slate-900 text-sm">{record.userName}</div>
                            <div className="text-slate-600 text-xs">{record.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.plan === "premium"
                              ? "bg-teal-100 text-teal-700"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {record.plan === "premium" ? "Premium" : String(record.plan).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{record.reason.replaceAll("-", " ")}</td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{formatDate(record.createdAt)}</td>
                        <td className="py-4 px-4 text-slate-600 text-sm">{record.feedback || "No additional feedback"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {recentRecords.length === 0 && (
                <div className="p-6 text-sm text-slate-600">{churnError || "No cancellation feedback has been submitted yet."}</div>
              )}
            </div>

            {/* Live Observations */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-orange-900 mb-2">Live Observations</h3>
                  <ul className="text-orange-800 text-sm space-y-2">
                    <li>• <strong>{totalCancellations} cancellation entries have been recorded.</strong> This section is now driven by platform-user feedback rather than trader applications.</li>
                    <li>• <strong>{churnSummary[0]?.count ?? 0} users selected the top reason.</strong> Use the reason chart to see which churn pattern is emerging most often.</li>
                    <li>• <strong>Free-text feedback is now stored live.</strong> The recent feedback table shows the written comments users submitted when cancelling.</li>
                    <li>• <strong>The trend chart is month-based.</strong> As more users submit cancellation feedback, this section will become useful for retention analysis.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "audits" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  Account Deletion Audits
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Recent self-service account deletions with retained audit metadata.
                </p>
              </div>
              <div className="p-6">
                {deletionAuditError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {deletionAuditError}
                  </div>
                ) : deletionAudits.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    No account deletion audits recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">User</th>
                          <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Deleted At</th>
                          <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Billing</th>
                          <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Broker Data</th>
                          <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">API Keys</th>
                          <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Stripe Links</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deletionAudits.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="py-4 px-4">
                              <div className="text-slate-900">{item.userName}</div>
                              <div className="text-xs text-slate-600">{item.previousEmail}</div>
                              <div className="text-xs text-slate-500">Anonymised to {item.deletedEmail}</div>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-700">{formatDate(item.deletedAt)}</td>
                            <td className="py-4 px-4 text-sm text-slate-700">
                              {item.hadBillingHistory ? "Had billing history" : "No billing history"}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-700">
                              {item.hadBrokerAccounts ? "Broker accounts existed" : "No broker accounts"}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-700">
                              {item.hadApiKeys ? "API keys revoked" : "No API keys"}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-700">
                              {item.stripeCustomerId || item.stripeSubscriptionId ? "Stripe linked" : "No Stripe link"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TECHNICAL GUIDE SECTION */}
        {activeSection === "guide" && (
          <div className="space-y-6">
            {/* Introduction */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg shadow-md p-6">
              <h2 className="text-xl mb-2 flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Technical Terms Glossary
              </h2>
              <p className="text-sm text-white/90">
                Quick reference guide for all trading, machine learning, and platform terminology used throughout Green Turtle Trades.
              </p>
            </div>

            {/* Trading Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-teal-50 p-4">
                <h3 className="text-lg text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Trading Performance Metrics
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-teal-900 mb-1">R-Multiple / R-Value</h4>
                    <p className="text-slate-600 text-sm">
                      A standardised measure of profit/loss relative to initial risk. If you risk £100 (your stop loss) and make £200 profit, that's +2R. If you lose £50, that's -0.5R. R-multiples allow comparison of trades regardless of position size.
                    </p>
                  </div>
                  
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-teal-900 mb-1">Expectancy</h4>
                    <p className="text-slate-600 text-sm">
                      The average R-multiple per trade. This represents your statistical "edge" in the market. Positive expectancy indicates profitability on average, with higher values representing a stronger edge. Calculated as: (Win Rate × Average Win) - (Loss Rate × Average Loss).
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-teal-900 mb-1">Win Rate</h4>
                    <p className="text-slate-600 text-sm">
                      The percentage of trades that are profitable. For example, 65% win rate means 65 out of 100 trades were winners. Important: a high win rate doesn't guarantee profitability—expectancy is more important.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-teal-900 mb-1">Sharpe Ratio</h4>
                    <p className="text-slate-600 text-sm">
                      Measures risk-adjusted returns. It shows how much excess return you're receiving for the volatility of your trading. Higher is better. A Sharpe ratio above 1 is considered good, above 2 is very good, and above 3 is excellent.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-teal-900 mb-1">Maximum Drawdown</h4>
                    <p className="text-slate-600 text-sm">
                      The largest peak-to-trough decline in your account equity. For example, if your account grew from £10,000 to £15,000, then dropped to £12,000, your maximum drawdown is £3,000 (20%). Critical for understanding worst-case scenarios.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-teal-900 mb-1">Profit Factor</h4>
                    <p className="text-slate-600 text-sm">
                      Total gross profit divided by total gross loss. A profit factor of 2.0 means you make £2 for every £1 you lose. Values above 1.0 indicate profitability, with higher values demonstrating stronger performance.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-teal-900 mb-1">Recovery Factor</h4>
                    <p className="text-slate-600 text-sm">
                      Net profit divided by maximum drawdown. Shows how efficiently a strategy recovers from losses. Higher values indicate better risk management. For example, a recovery factor of 5 means you made 5 times your worst drawdown.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-teal-900 mb-1">Payoff Ratio</h4>
                    <p className="text-slate-600 text-sm">
                      Average win divided by average loss. A payoff ratio of 2.0 means your average winning trade is twice the size of your average losing trade. Combined with win rate, this determines profitability.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-teal-900 mb-1">Consecutive Wins/Losses</h4>
                    <p className="text-slate-600 text-sm">
                      Sequences of winning or losing trades in a row. Understanding these patterns helps identify psychological biases (overconfidence after wins, hesitation after losses) and adjust position sizing during streaks.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Machine Learning & Analytics Terms */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-purple-50 p-4">
                <h3 className="text-lg text-slate-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Machine Learning & Analytics Terms
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-purple-900 mb-1">Bayesian Optimisation</h4>
                    <p className="text-slate-600 text-sm">
                      An intelligent search method that finds optimal trading parameters (stop loss levels, take profit targets, trailing stops) using probabilistic modelling. More computationally efficient than testing every possible combination, it learns from previous tests to predict which parameter combinations are most likely to improve performance.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-purple-900 mb-1">Survival Analysis</h4>
                    <p className="text-slate-600 text-sm">
                      Statistical technique that calculates the probability of a trade reaching profit targets before hitting stop losses over time. It models trade "survival" and estimates when exits are most likely to occur, helping optimise timing strategies.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-purple-900 mb-1">K-Means Clustering</h4>
                    <p className="text-slate-600 text-sm">
                      Unsupervised machine learning algorithm that groups similar data points together without being told what to look for. In our platform, it analyses volatility, spread, and trading session data to identify distinct market regimes (e.g., "Choppy Range", "Trending Bull", "Low Liquidity").
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-purple-900 mb-1">Market Regimes</h4>
                    <p className="text-slate-600 text-sm">
                      Distinct market conditions identified through clustering analysis. Each regime has unique characteristics (e.g., high/low volatility, trending/ranging) and different performance patterns. Understanding which regimes suit your strategy helps improve trade selection.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-purple-900 mb-1">Counterfactual Analysis</h4>
                    <p className="text-slate-600 text-sm">
                      "What if" scenario testing that simulates how your trades would have performed with different parameters. For example, "What if I used a 1.5R target instead of 2R?" or "What if I avoided trading after 3 consecutive losses?" Helps identify strategy improvements.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-purple-900 mb-1">Machine Learning (ML)</h4>
                    <p className="text-slate-600 text-sm">
                      Computer systems that learn from data to make predictions and identify patterns without explicit programming. Our Turtle Analytics uses ML to analyse your trading history, discover hidden patterns, and generate personalised performance insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Management Terms */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-amber-50 p-4">
                <h3 className="text-lg text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Risk Management Terms
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-amber-900 mb-1">Volatility</h4>
                    <p className="text-slate-600 text-sm">
                      The degree of price fluctuation in a market. High volatility means large price swings; low volatility means stable prices. Measured using metrics like Average True Range (ATR) or standard deviation. Affects risk management and position sizing decisions.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-amber-900 mb-1">Stop Loss (SL)</h4>
                    <p className="text-slate-600 text-sm">
                      A predetermined price level where you exit a losing trade to limit loss. For example, if you buy at £100 with a stop loss at £95, your maximum loss is £5 per share. Essential for risk management and calculating position size.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-amber-900 mb-1">Take Profit (TP)</h4>
                    <p className="text-slate-600 text-sm">
                      A predetermined price level where you exit a winning trade to secure profits. For example, if you buy at £100 with a take profit at £110, you automatically exit with £10 profit per share when that level is reached.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-amber-900 mb-1">Trailing Stop</h4>
                    <p className="text-slate-600 text-sm">
                      A dynamic stop loss that moves with the price to lock in profits while giving trades room to grow. For example, a 50-pip trailing stop stays 50 pips below the highest price reached. If price reverses 50 pips from the peak, you exit with profits protected.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-amber-900 mb-1">Spread</h4>
                    <p className="text-slate-600 text-sm">
                      The difference between the bid (sell) and ask (buy) price. Lower spreads mean lower trading costs. For example, if EUR/USD bid is 1.1000 and ask is 1.1002, the spread is 2 pips. Important for scalpers and day traders.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform & Business Terms */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-blue-50 p-4">
                <h3 className="text-lg text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Platform & Business Terms
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-blue-900 mb-1">Pay-As-You-Go (PAYG)</h4>
                    <p className="text-slate-600 text-sm">
                      Our subscription model: £10/month + £0.20 per trade analysed. You only pay for ML analyses you actually use, making it cost-effective for traders with varying activity levels. No long-term commitment required.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-blue-900 mb-1">API Key</h4>
                    <p className="text-slate-600 text-sm">
                      A unique authentication code that allows secure communication between your trading platform (e.g., MT4/MT5) and Green Turtle Trades. Think of it as a password that programs use to talk to each other. Never share your API key publicly or include it in shared code.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-blue-900 mb-1">Churn Rate</h4>
                    <p className="text-slate-600 text-sm">
                      The percentage of users who cancel their subscription within a given period. For example, if 5 out of 100 users cancel in a month, the monthly churn rate is 5%. Lower churn indicates higher user satisfaction and retention.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-blue-900 mb-1">Retention Rate</h4>
                    <p className="text-slate-600 text-sm">
                      The percentage of users who remain active/subscribed over time. The opposite of churn rate. For example, if 95 out of 100 users remain active after a month, the retention rate is 95%. Higher retention indicates product-market fit.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-blue-900 mb-1">Premium Conversion</h4>
                    <p className="text-slate-600 text-sm">
                      The percentage of users who upgrade from a basic plan to a premium plan. Indicates the value users see in advanced features. For example, if 20 out of 100 users upgrade, the premium conversion rate is 20%.
                    </p>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-blue-900 mb-1">Active User</h4>
                    <p className="text-slate-600 text-sm">
                      A registered trader who has an active subscription and is actively using the platform (executing trades and running ML analyses). Inactive users have paused subscriptions or stopped trading.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-blue-900 mb-1">Turtle Analytics</h4>
                    <p className="text-slate-600 text-sm">
                      Our flagship ML-powered performance analysis system. Named after the legendary Turtle Traders experiment, it analyses your trading history using counterfactual simulations, Bayesian optimisation, survival analysis, and K-Means clustering to provide personalised performance insights and improvement recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Reference Note */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-teal-900 mb-2">Quick Reference Tip</h3>
                  <p className="text-teal-800 text-sm">
                    Bookmark this page for quick access. When supporting traders or reviewing platform metrics, you can use ⌘+F (Mac) or Ctrl+F (Windows) to quickly search for any term you need clarification on. All terms are written in British English to match our UK-based platform standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trader Details Modal */}
      {selectedTrader && (
        <TraderDetailsModal
          trader={selectedTrader}
          onClose={() => setSelectedTrader(null)}
        />
      )}
    </div>
  );
}
