import { Users, TrendingUp, DollarSign, Activity, Shield, UserPlus, Trash2, Search, BarChart3, Brain, CreditCard, Eye, Filter, Calendar, UserX, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { TraderDetailsModal } from "./TraderDetailsModal";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { fetchAdminMetrics, type AdminMetrics } from "../api/admin";

interface AdminDashboardProps {
  onLogout: () => void;
}

interface TraderData {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  plan: "payg" | "premium";
  joinDate: string;
  totalTrades: number;
  mlAnalyses: number;
  revenue: number;
  winRate: number;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "support" | "analyst";
  status: "active" | "inactive";
  joinDate: string;
  lastActive: string;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<"overview" | "staff" | "churn" | "guide">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrader, setSelectedTrader] = useState<TraderData | null>(null);
  const [traderFilter, setTraderFilter] = useState<"all" | "most-ml" | "best-performance" | "worst-performance">("all");
  const [timePeriod, setTimePeriod] = useState<"7d" | "30d" | "3m" | "6m" | "1y" | "all">("30d");
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);

  // Mock trader data with win rates
  const mockTraders: TraderData[] = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@email.com",
      status: "active",
      plan: "premium",
      joinDate: "2025-01-01",
      totalTrades: 234,
      mlAnalyses: 156,
      revenue: 35.00,
      winRate: 68.5
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      status: "active",
      plan: "payg",
      joinDate: "2025-01-02",
      totalTrades: 89,
      mlAnalyses: 34,
      revenue: 16.80,
      winRate: 71.2
    },
    {
      id: "3",
      name: "Michael Brown",
      email: "m.brown@email.com",
      status: "active",
      plan: "payg",
      joinDate: "2024-12-28",
      totalTrades: 156,
      mlAnalyses: 67,
      revenue: 23.40,
      winRate: 64.8
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.davis@email.com",
      status: "inactive",
      plan: "premium",
      joinDate: "2024-12-15",
      totalTrades: 0,
      mlAnalyses: 0,
      revenue: 0,
      winRate: 0
    },
    {
      id: "5",
      name: "David Wilson",
      email: "d.wilson@email.com",
      status: "active",
      plan: "premium",
      joinDate: "2024-12-10",
      totalTrades: 456,
      mlAnalyses: 298,
      revenue: 35.00,
      winRate: 72.1
    }
  ];

  // Mock staff data
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: "1",
      name: "Admin User",
      email: "admin@greenturtletrades.com",
      role: "admin",
      status: "active",
      joinDate: "2024-01-01",
      lastActive: "2 min ago"
    },
    {
      id: "2",
      name: "Jane Support",
      email: "jane.support@greenturtletrades.com",
      role: "support",
      status: "active",
      joinDate: "2024-06-15",
      lastActive: "1 hour ago"
    },
    {
      id: "3",
      name: "Mark Analyst",
      email: "mark.analyst@greenturtletrades.com",
      role: "analyst",
      status: "active",
      joinDate: "2024-08-20",
      lastActive: "3 hours ago"
    }
  ]);

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "support" as "admin" | "support" | "analyst"
  });

  useEffect(() => {
    let isMounted = true;
    fetchAdminMetrics()
      .then((metrics) => {
        if (isMounted) {
          setAdminMetrics(metrics);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAdminMetrics(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate stats
  const totalRevenue = mockTraders.reduce((sum, t) => sum + t.revenue, 0);
  const monthlyRevenue = 12450;
  const totalMLAnalyses = mockTraders.reduce((sum, t) => sum + t.mlAnalyses, 0);
  const totalTraders = mockTraders.length;
  const activeTraders = mockTraders.filter(t => t.status === "active").length;
  const premiumCount = mockTraders.filter(t => t.plan === "premium").length;
  const paygCount = mockTraders.filter(t => t.plan === "payg").length;
  const displayTotalUsers = adminMetrics?.waitlistCount ?? totalTraders;
  const displayActiveUsers = adminMetrics
    ? Math.min(activeTraders, displayTotalUsers)
    : activeTraders;
  const displayInactiveUsers = Math.max(displayTotalUsers - displayActiveUsers, 0);
  const displayNewUsers = adminMetrics?.createdTodayWaitlistCount ?? 2;

  // Chart data for Revenue
  const revenueChartData = [
    { month: "Sep", revenue: 8200 },
    { month: "Oct", revenue: 9400 },
    { month: "Nov", revenue: 10800 },
    { month: "Dec", revenue: 11200 },
    { month: "Jan", revenue: 12450 }
  ];

  // Chart data for ML Usage
  const mlUsageChartData = [
    { month: "Sep", analyses: 380 },
    { month: "Oct", analyses: 425 },
    { month: "Nov", analyses: 490 },
    { month: "Dec", analyses: 520 },
    { month: "Jan", analyses: 555 }
  ];

  // Pie chart data for subscription split
  const subscriptionPieData = [
    { name: "Premium", value: premiumCount, color: "#0d9488" },
    { name: "PAYG", value: paygCount, color: "#64748b" }
  ];

  // Mock churn/cancellation data
  const churnData = [
    { reason: "too-expensive", label: "Too expensive", count: 12, percentage: 35.3 },
    { reason: "not-using", label: "Not using enough", count: 8, percentage: 23.5 },
    { reason: "missing-features", label: "Missing features", count: 5, percentage: 14.7 },
    { reason: "technical-issues", label: "Technical issues", count: 4, percentage: 11.8 },
    { reason: "found-alternative", label: "Found alternative", count: 3, percentage: 8.8 },
    { reason: "results-not-helpful", label: "Results not helpful", count: 2, percentage: 5.9 }
  ];

  const totalCancellations = churnData.reduce((sum, item) => sum + item.count, 0);
  const churnRate = ((totalCancellations / (totalTraders + totalCancellations)) * 100).toFixed(1);

  // Detailed cancellation records
  const cancellationRecords = [
    { id: "1", userName: "Alex Turner", email: "alex.t@email.com", plan: "payg", date: "2025-01-15", reason: "too-expensive", feedback: "Love the platform but can't justify the cost right now. Might come back later." },
    { id: "2", userName: "Maria Garcia", email: "maria.g@email.com", plan: "premium", date: "2025-01-14", reason: "not-using", feedback: "Taking a break from trading for a few months." },
    { id: "3", userName: "James Wilson", email: "j.wilson@email.com", plan: "payg", date: "2025-01-12", reason: "missing-features", feedback: "Would love to see more advanced risk management features." },
    { id: "4", userName: "Sophie Martin", email: "sophie.m@email.com", plan: "premium", date: "2025-01-10", reason: "technical-issues", feedback: "Had issues with MT4 connection. Support couldn't resolve it." },
    { id: "5", userName: "David Lee", email: "d.lee@email.com", plan: "payg", date: "2025-01-08", reason: "found-alternative", feedback: "" },
  ];

  // Churn trend data
  const churnTrendData = [
    { month: "Sep", cancellations: 4, signups: 28 },
    { month: "Oct", cancellations: 5, signups: 32 },
    { month: "Nov", cancellations: 6, signups: 35 },
    { month: "Dec", cancellations: 8, signups: 30 },
    { month: "Jan", cancellations: 11, signups: 38 }
  ];

  // Filter and sort traders
  let filteredTraders = mockTraders.filter(trader => 
    trader.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    trader.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply sorting based on filter
  if (traderFilter === "most-ml") {
    filteredTraders = [...filteredTraders].sort((a, b) => b.mlAnalyses - a.mlAnalyses);
  } else if (traderFilter === "best-performance") {
    filteredTraders = [...filteredTraders].sort((a, b) => b.winRate - a.winRate);
  } else if (traderFilter === "worst-performance") {
    filteredTraders = [...filteredTraders].sort((a, b) => a.winRate - b.winRate);
  }

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: StaffMember = {
      id: String(staffMembers.length + 1),
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      status: "active",
      joinDate: new Date().toISOString().split('T')[0],
      lastActive: "Just now"
    };
    setStaffMembers([...staffMembers, newMember]);
    setNewStaff({ name: "", email: "", role: "support" });
    setShowAddStaff(false);
  };

  const handleRemoveStaff = (id: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      setStaffMembers(staffMembers.filter(s => s.id !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "active"
      ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>
      : <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">Inactive</span>;
  };

  const getPlanBadge = (plan: string) => {
    return plan === "premium" 
      ? <span className="px-2 py-1 text-xs rounded-full bg-teal-100 text-teal-700">Premium</span>
      : <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">PAYG</span>;
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-red-100 text-red-700",
      support: "bg-blue-100 text-blue-700",
      analyst: "bg-purple-100 text-purple-700"
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${roleColors[role as keyof typeof roleColors]}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
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

        {/* Navigation - 2 Main Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 p-2">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setActiveSection("overview")}
              className={`py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeSection === "overview"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveSection("staff")}
              className={`py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeSection === "staff"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Staff Management</span>
            </button>
            <button
              onClick={() => setActiveSection("churn")}
              className={`py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeSection === "churn"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <UserX className="w-5 h-5" />
              <span>Churn Analysis</span>
            </button>
            <button
              onClick={() => setActiveSection("guide")}
              className={`py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${
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
                    <div className="text-xs text-blue-600">Jan 2026</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1 flex items-center gap-1">
                      <UserX className="w-3.5 h-3.5" />
                      Cancelled Plans
                    </div>
                    <div className="text-3xl text-slate-900 mb-1">3</div>
                    <div className="text-xs text-red-600">6% churn rate</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Inactive Users</div>
                    <div className="text-3xl text-slate-900 mb-1">{displayInactiveUsers}</div>
                    <div className="text-xs text-amber-600">Not trading</div>
                  </div>
                </div>

                {/* User Growth Chart and Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h3 className="text-sm text-slate-700 mb-3">User Growth Trend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={[
                        { month: "Sep", users: 3 },
                        { month: "Oct", users: 3 },
                        { month: "Nov", users: 4 },
                        { month: "Dec", users: 4 },
                        { month: "Jan", users: 5 }
                      ]}>
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
                        <div className="text-xl text-slate-900">{(mockTraders.reduce((sum, t) => sum + t.totalTrades, 0) / totalTraders).toFixed(0)}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Avg. ML Uses per User</div>
                        <div className="text-xl text-slate-900">{(totalMLAnalyses / totalTraders).toFixed(0)}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Premium Conversion</div>
                        <div className="text-xl text-teal-600">{((premiumCount / totalTraders) * 100).toFixed(0)}%</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="text-xs text-slate-600 mb-1">Retention Rate</div>
                        <div className="text-xl text-green-600">{((activeTraders / totalTraders) * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subsection 1: Revenue with Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Company Revenue
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Monthly Revenue</div>
                    <div className="text-3xl text-slate-900 mb-1">£{monthlyRevenue.toLocaleString()}</div>
                    <div className="text-xs text-green-600">↑ 15% from last month</div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Premium Revenue</div>
                    <div className="text-3xl text-slate-900 mb-1">£{(premiumCount * 35).toLocaleString()}</div>
                    <div className="text-xs text-slate-600">{premiumCount} subscribers @ £35/mo</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">PAYG Revenue</div>
                    <div className="text-3xl text-slate-900 mb-1">£{(paygCount * 10 + 45).toFixed(0)}</div>
                    <div className="text-xs text-slate-600">{paygCount} subscribers + usage</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Avg. Revenue/Trader</div>
                    <div className="text-3xl text-slate-900 mb-1">£{(totalRevenue / totalTraders).toFixed(2)}</div>
                    <div className="text-xs text-slate-600">Per active trader</div>
                  </div>
                </div>

                {/* Revenue Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h3 className="text-sm text-slate-700 mb-3">Revenue Trend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                          formatter={(value: number) => [`£${value}`, 'Revenue']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-sm text-slate-700 mb-3">Plan Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={subscriptionPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {subscriptionPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Subsection 2: ML Model Usage with Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h2 className="text-lg text-slate-900 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  ML Model Usage
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Total Analyses</div>
                    <div className="text-3xl text-slate-900 mb-1">{totalMLAnalyses.toLocaleString()}</div>
                    <div className="text-xs text-purple-600">Turtle Analytics runs</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Avg. per Trader</div>
                    <div className="text-3xl text-slate-900 mb-1">{(totalMLAnalyses / totalTraders).toFixed(0)}</div>
                    <div className="text-xs text-slate-600">Analyses per account</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Success Rate</div>
                    <div className="text-3xl text-slate-900 mb-1">94.8%</div>
                    <div className="text-xs text-cyan-600">Model accuracy</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm mb-1">Avg. Processing Time</div>
                    <div className="text-3xl text-slate-900 mb-1">1.2s</div>
                    <div className="text-xs text-slate-600">Per analysis</div>
                  </div>
                </div>

                {/* ML Usage Chart */}
                <div>
                  <h3 className="text-sm text-slate-700 mb-3">ML Analysis Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={mlUsageChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value}`, 'Analyses']}
                      />
                      <Bar dataKey="analyses" fill="#a855f7" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Subsection 3: Trader Accounts with Filter */}
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
                        <option value="most-ml">Most ML Usage</option>
                        <option value="best-performance">Best Performance</option>
                        <option value="worst-performance">Worst Performance</option>
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
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Plan</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Win Rate</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Total Trades</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">ML Analyses</th>
                      <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Revenue</th>
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
                        <td className="py-4 px-4">{getStatusBadge(trader.status)}</td>
                        <td className="py-4 px-4">{getPlanBadge(trader.plan)}</td>
                        <td className="py-4 px-4">
                          <span className={`${
                            trader.winRate > 70 ? 'text-green-600' : 
                            trader.winRate > 60 ? 'text-slate-900' : 
                            trader.winRate > 0 ? 'text-amber-600' : 'text-slate-400'
                          }`}>
                            {trader.winRate > 0 ? `${trader.winRate}%` : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-900">{trader.totalTrades}</td>
                        <td className="py-4 px-4 text-slate-900">{trader.mlAnalyses}</td>
                        <td className="py-4 px-4 text-slate-900">£{trader.revenue.toFixed(2)}</td>
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
                  <p className="text-slate-600">No traders found</p>
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
                <h2 className="text-lg text-slate-900">Staff Members</h2>
                <button
                  onClick={() => setShowAddStaff(!showAddStaff)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Staff
                </button>
              </div>
            </div>

            {/* Add Staff Form */}
            {showAddStaff && (
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 mb-2 text-sm">Name</label>
                      <input
                        type="text"
                        value={newStaff.name}
                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-2 text-sm">Email</label>
                      <input
                        type="email"
                        value={newStaff.email}
                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        placeholder="john@greenturtletrades.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-2 text-sm">Role</label>
                      <select
                        value={newStaff.role}
                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      >
                        <option value="support">Support</option>
                        <option value="analyst">Analyst</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                    >
                      Add Staff Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddStaff(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
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
                      <td className="py-4 px-4 text-slate-900 text-sm">{staff.joinDate}</td>
                      <td className="py-4 px-4 text-slate-600 text-sm">{staff.lastActive}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleRemoveStaff(staff.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove Staff"
                          disabled={staff.role === "admin" && staff.id === "1"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border-t border-amber-200 p-3">
              <p className="text-amber-800 text-xs">
                <strong>Note:</strong> Staff members will receive an email invitation to set their password and configure 2FA.
              </p>
            </div>
          </div>
        )}

        {/* CHURN ANALYSIS SECTION */}
        {activeSection === "churn" && (
          <div className="space-y-6">
            {/* Churn Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm">Total Cancellations</span>
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-slate-900 text-3xl mb-1">{totalCancellations}</div>
                <div className="text-slate-500 text-xs">This month</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm">Churn Rate</span>
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-slate-900 text-3xl mb-1">{churnRate}%</div>
                <div className="text-slate-500 text-xs">Overall rate</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 text-sm">Top Reason</span>
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-slate-900 text-xl mb-1">Too Expensive</div>
                <div className="text-slate-500 text-xs">{churnData[0].percentage}% of cancellations</div>
              </div>
            </div>

            {/* Cancellation Reasons Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-slate-900 text-lg mb-4">Cancellation Reasons Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={churnData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value} cancellations`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Churn Trend */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-slate-900 text-lg mb-4">Churn vs Signups Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={churnTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="signups" stroke="#0d9488" strokeWidth={2} name="New Signups" />
                  <Line type="monotone" dataKey="cancellations" stroke="#ef4444" strokeWidth={2} name="Cancellations" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Cancellation Records */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 p-4">
                <h3 className="text-slate-900 text-lg">Recent Cancellations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-slate-600 text-sm">User</th>
                      <th className="text-left py-3 px-4 text-slate-600 text-sm">Plan</th>
                      <th className="text-left py-3 px-4 text-slate-600 text-sm">Date</th>
                      <th className="text-left py-3 px-4 text-slate-600 text-sm">Reason</th>
                      <th className="text-left py-3 px-4 text-slate-600 text-sm">Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancellationRecords.map((record) => (
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
                            {record.plan === "premium" ? "Premium" : "PAYG"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-900 text-sm">{record.date}</td>
                        <td className="py-4 px-4">
                          <span className="text-slate-900 text-sm">
                            {churnData.find(d => d.reason === record.reason)?.label || record.reason}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-600 text-sm max-w-md truncate">
                            {record.feedback || <span className="text-slate-400 italic">No feedback provided</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actionable Insights */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-orange-900 mb-2">Actionable Insights</h3>
                  <ul className="text-orange-800 text-sm space-y-2">
                    <li>• <strong>35.3% cite pricing as the main issue</strong> - Consider offering a mid-tier plan or promotional pricing for traders with lower volumes</li>
                    <li>• <strong>23.5% not using the platform enough</strong> - Improve onboarding and send engagement emails with tips on maximising value</li>
                    <li>• <strong>11.8% experiencing technical issues</strong> - Prioritize support response times and create detailed troubleshooting guides</li>
                    <li>• <strong>Churn trending upward</strong> - January saw {churnTrendData[4].cancellations} cancellations vs {churnTrendData[0].cancellations} in September. Immediate action needed.</li>
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
