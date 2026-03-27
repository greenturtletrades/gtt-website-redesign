import { Users, TrendingUp, Activity, Shield, Search, BarChart3, Brain, Eye, Filter, Calendar, UserX, BookOpen, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { TraderDetailsModal } from "./TraderDetailsModal";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import {
  fetchAdminChurnFeedback,
  fetchAdminSignups,
  fetchAdminStaff,
  fetchAdminTraders,
  inviteAdmin,
  type AdminChurnFeedbackItem,
  type AdminChurnFeedbackSummary,
  type AdminStaffMember,
  type AdminSignupItem,
  type AdminTrader,
  type GroupedAdminSignupItem,
} from "../api/admin";

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<"overview" | "signups" | "staff" | "churn" | "guide">("overview");
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
  const [signupItems, setSignupItems] = useState<AdminSignupItem[]>([]);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSearchQuery, setSignupSearchQuery] = useState("");
  const [signupFilter, setSignupFilter] = useState<"all" | AdminSignupItem["sourceType"]>("all");
  const [showInviteStaff, setShowInviteStaff] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadAdminData = async () => {
      try {
        const [traderResponse, staffResponse, churnResponse, signupResponse] = await Promise.all([
          fetchAdminTraders(),
          fetchAdminStaff(),
          fetchAdminChurnFeedback(),
          fetchAdminSignups(),
        ]);
        if (!isMounted) return;
        setTraders(traderResponse.items);
        setStaffMembers(staffResponse.items);
        setChurnItems(churnResponse.items);
        setChurnSummary(churnResponse.summary);
        setSignupItems(signupResponse.items);
        setTradersError(null);
        setStaffError(null);
        setChurnError(null);
        setSignupError(null);
      } catch (error) {
        if (!isMounted) return;
        setTraders([]);
        setStaffMembers([]);
        setChurnItems([]);
        setChurnSummary([]);
        setSignupItems([]);
        setTradersError(error instanceof Error ? error.message : "Unable to load trader accounts.");
        setStaffError(error instanceof Error ? error.message : "Unable to load staff members.");
        setChurnError(error instanceof Error ? error.message : "Unable to load churn feedback.");
        setSignupError(error instanceof Error ? error.message : "Unable to load signups.");
      } finally {
        if (isMounted) {
          setTradersLoading(false);
        }
      }
    };

    loadAdminData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate stats
  const totalMLAnalyses = traders.reduce((sum, trader) => sum + trader.historyExportCount, 0);
  const totalTraders = traders.length;
  const activeTraders = traders.filter((trader) => trader.accountStatus === "ACTIVE").length;
  const premiumCount = traders.filter((trader) => trader.plan === "premium").length;
  const paygCount = traders.filter((trader) => trader.plan === "payg").length;
  const activeEaConnections = traders.filter((trader) => trader.lastEaSyncAt !== null).length;
  const displayTotalUsers = totalTraders;
  const displayActiveUsers = activeTraders;
  const displayInactiveUsers = Math.max(displayTotalUsers - displayActiveUsers, 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const displayNewUsers = traders.filter((trader) => {
    const joinedAt = new Date(trader.joinedAt);
    return joinedAt.getMonth() === currentMonth && joinedAt.getFullYear() === currentYear;
  }).length;
  const disabledTraders = traders.filter((trader) => trader.accountStatus === "DISABLED").length;
  const tradersWithApiKeys = traders.filter((trader) => trader.apiKeysCount > 0).length;
  const userGrowthTrend = Array.from({ length: 5 }, (_, index) => {
    const monthDate = new Date(currentYear, currentMonth - (4 - index), 1);
    const label = monthDate.toLocaleDateString(undefined, { month: "short" });
    const users = traders.filter((trader) => {
      const joinedAt = new Date(trader.joinedAt);
      return (
        joinedAt.getFullYear() < monthDate.getFullYear() ||
        (joinedAt.getFullYear() === monthDate.getFullYear() &&
          joinedAt.getMonth() <= monthDate.getMonth())
      );
    }).length;
    return { month: label, users };
  });

  const activityChartData = Array.from({ length: 5 }, (_, index) => {
    const monthDate = new Date(currentYear, currentMonth - (4 - index), 1);
    const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const label = monthDate.toLocaleDateString(undefined, { month: "short" });
    const newAccounts = traders.filter((trader) => {
      if (!trader.hasAccount) return false;
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
  const landingSignupCount = new Set(signupItems.filter((item) => item.sourceType === "landing_waitlist").map((item) => item.email.toLowerCase())).size;
  const investorSignupCount = new Set(signupItems.filter((item) => item.sourceType === "investor_waitlist").map((item) => item.email.toLowerCase())).size;
  const traderApplicationSignupCount = new Set(signupItems.filter((item) => item.sourceType === "trader_application").map((item) => item.email.toLowerCase())).size;
  const traderAccountSignupCount = new Set(signupItems.filter((item) => item.sourceType === "trader_account").map((item) => item.email.toLowerCase())).size;
  const uniqueSignupCount = new Set(signupItems.map((item) => item.email.toLowerCase())).size;

  // Filter and sort traders
  let filteredTraders = traders.filter(trader => 
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
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${roleColors[role as keyof typeof roleColors]}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
  };

  const getSignupSourceLabel = (sourceType: AdminSignupItem["sourceType"]) => {
    if (sourceType === "landing_waitlist") return "Landing Page";
    if (sourceType === "investor_waitlist") return "Investor Signup";
    if (sourceType === "trader_application") return "Trader Application";
    return "Trader Account";
  };

  const getSignupSourceBadge = (sourceType: AdminSignupItem["sourceType"]) => {
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

  const getAnalysisStatusBadge = (status: AdminTrader["analysisStatus"]) => {
    if (status === "ANALYSIS_READY") {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Analysis Ready</span>;
    }
    if (status === "NEEDS_ANALYSIS") {
      return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Needs Analysis</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">No Trade Data</span>;
  };

  const groupedSignupItems: GroupedAdminSignupItem[] = Array.from(
    signupItems.reduce((map, item) => {
      const emailKey = item.email.trim().toLowerCase();
      const existing = map.get(emailKey);
      const normalizedDetail = item.detail?.trim() || "";
      const normalizedStatus = item.status.trim();
      const normalizedName = item.name?.trim() || null;

      if (!existing) {
        map.set(emailKey, {
          id: item.id,
          email: emailKey,
          name: normalizedName,
          sourceTypes: [item.sourceType],
          statuses: [normalizedStatus],
          details: normalizedDetail ? [normalizedDetail] : [],
          submittedAt: item.submittedAt,
          entryCount: 1,
        });
        return map;
      }

      existing.entryCount += 1;
      if (normalizedName && !existing.name) {
        existing.name = normalizedName;
      }
      if (!existing.sourceTypes.includes(item.sourceType)) {
        existing.sourceTypes.push(item.sourceType);
      }
      if (!existing.statuses.includes(normalizedStatus)) {
        existing.statuses.push(normalizedStatus);
      }
      if (normalizedDetail && !existing.details.includes(normalizedDetail)) {
        existing.details.push(normalizedDetail);
      }
      if (new Date(item.submittedAt).getTime() > new Date(existing.submittedAt).getTime()) {
        existing.submittedAt = item.submittedAt;
        existing.id = item.id;
      }

      return map;
    }, new Map<string, GroupedAdminSignupItem>()).values()
  ).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const filteredSignupItems = groupedSignupItems.filter((item) => {
    const matchesFilter = signupFilter === "all" || item.sourceTypes.includes(signupFilter);
    const query = signupSearchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.email.toLowerCase().includes(query) ||
      (item.name || "").toLowerCase().includes(query) ||
      item.details.some((detail) => detail.toLowerCase().includes(query)) ||
      item.sourceTypes.some((sourceType) => getSignupSourceLabel(sourceType).toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  const reloadStaff = async () => {
    const staffResponse = await fetchAdminStaff();
    setStaffMembers(staffResponse.items);
    setStaffError(null);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteSubmitting) return;

    setInviteSubmitting(true);
    setInviteMessage(null);
    setInviteError(null);

    try {
      await inviteAdmin(inviteEmail, inviteCode);
      await reloadStaff();
      setInviteMessage(`Invite sent for ${inviteEmail.trim().toLowerCase()}. The one-time code will require a password change on first login.`);
      setInviteEmail("");
      setInviteCode("");
      setShowInviteStaff(false);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Unable to invite admin.");
    } finally {
      setInviteSubmitting(false);
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
              <span>Account Health</span>
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
                    <div className="text-slate-600 text-sm mb-1">Total Users</div>
                    <div className="text-3xl text-slate-900 mb-1">{displayTotalUsers}</div>
                    <div className="text-xs text-teal-600">Registered traders</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Active Users</div>
                    <div className="text-3xl text-slate-900 mb-1">{displayActiveUsers}</div>
                    <div className="text-xs text-green-600">{displayTotalUsers > 0 ? ((displayActiveUsers / displayTotalUsers) * 100).toFixed(0) : 0}% of total</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">New This Month</div>
                    <div className="text-3xl text-slate-900 mb-1">{displayNewUsers}</div>
                    <div className="text-xs text-blue-600">Trader accounts created this month</div>
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
                    <div className="text-xs text-amber-600">Records with EA activity</div>
                  </div>
                </div>

                {/* User Growth Chart and Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h3 className="text-sm text-slate-700 mb-3">User Growth Trend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={userGrowthTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                          formatter={(value: number) => [`${value}`, 'Users']}
                        />
                        <Line type="monotone" dataKey="users" stroke="#0d9488" strokeWidth={2} dot={{ fill: '#0d9488', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-sm text-slate-700 mb-3">User Engagement</h3>
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Avg. Trades per User</div>
                        <div className="text-xl text-slate-900">{totalTraders > 0 ? (traders.reduce((sum, trader) => sum + trader.tradeEventCount, 0) / totalTraders).toFixed(0) : "0"}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Avg. ML Uses per User</div>
                        <div className="text-xl text-slate-900">{totalTraders > 0 ? (totalMLAnalyses / totalTraders).toFixed(0) : "0"}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Premium Traders</div>
                        <div className="text-xl text-teal-600">{totalTraders > 0 ? ((premiumCount / totalTraders) * 100).toFixed(0) : "0"}%</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Retention Rate</div>
                        <div className="text-xl text-green-600">{totalTraders > 0 ? ((activeTraders / totalTraders) * 100).toFixed(0) : "0"}%</div>
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
                    <div className="text-3xl text-slate-900 mb-1">{totalMLAnalyses.toLocaleString()}</div>
                    <div className="text-xs text-purple-600">Real HISTORY_EXPORT events</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Avg. Exports per Trader</div>
                    <div className="text-3xl text-slate-900 mb-1">{totalTraders > 0 ? (totalMLAnalyses / totalTraders).toFixed(0) : "0"}</div>
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
                  <h3 className="text-sm text-slate-700 mb-3">Trader Account Signup Trend</h3>
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
                        <option value="most-trades">Most Trade Events</option>
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
                    <div className="text-2xl text-green-600">{displayActiveUsers}</div>
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
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Trade Events</th>
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
                          <button
                            onClick={() => setSelectedTrader(trader)}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

        {/* STAFF MANAGEMENT SECTION */}
        {activeSection === "staff" && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg text-slate-900">Admin Staff</h2>
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

            {showInviteStaff && (
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <form onSubmit={handleInviteSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

            {/* Staff Table */}
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
                  {staffMembers.map((staff) => (
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
                        <span className="text-xs text-slate-500">
                          {staff.source === "environment" ? "Env admin" : "Database admin"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border-t border-amber-200 p-3">
              <p className="text-amber-800 text-xs">
                <strong>Note:</strong> Invited admins are real `ADMIN` users with a one-time code. They must change it on first login.
              </p>
            </div>
            {staffMembers.length === 0 && (
              <div className="p-6 text-sm text-slate-600">{staffError || "No admin staff records found."}</div>
            )}
          </div>
        )}

        {/* SIGNUPS SECTION */}
        {activeSection === "signups" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-600">Unique Emails</div>
                  <div className="mt-1 text-3xl text-slate-900">{uniqueSignupCount}</div>
                  <div className="text-xs text-slate-600">Grouped people across all signup sources</div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="text-sm text-slate-600">Landing Page Signups</div>
                  <div className="mt-1 text-3xl text-slate-900">{landingSignupCount}</div>
                  <div className="text-xs text-blue-700">Unique emails from landing page</div>
                </div>
                <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                  <div className="text-sm text-slate-600">Investor Signups</div>
                  <div className="mt-1 text-3xl text-slate-900">{investorSignupCount}</div>
                  <div className="text-xs text-cyan-700">Unique investor emails</div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm text-slate-600">Trader Applications</div>
                  <div className="mt-1 text-3xl text-slate-900">{traderApplicationSignupCount}</div>
                  <div className="text-xs text-amber-700">Unique applicant emails</div>
                </div>
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                  <div className="text-sm text-slate-600">Trader Accounts</div>
                  <div className="mt-1 text-3xl text-slate-900">{traderAccountSignupCount}</div>
                  <div className="text-xs text-teal-700">Unique trader account emails</div>
                </div>
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
                  </div>
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
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Statuses</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Details</th>
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
                      Our subscription model: £25/month + £0.20 per trade analysed. You only pay for ML analyses you actually use, making it cost-effective for traders with varying activity levels. No long-term commitment required.
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
