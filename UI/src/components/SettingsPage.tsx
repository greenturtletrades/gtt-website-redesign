import { useState } from "react";
import { Settings, User, CreditCard, Code, Key, Shield, Download, Copy, Check, AlertTriangle, Trash2, ChevronRight, Sparkles, HelpCircle, X, Gift, Users } from "lucide-react";

interface SettingsPageProps {
  userName: string;
  userEmail: string;
  currentPlan: "payg";
  subscriptionStatus?: "active" | "paused";
  onPauseSubscription?: () => void;
  onResumeSubscription?: () => void;
  onCancelSubscription: (reason: string, feedback: string) => void;
}

export function SettingsPage({ userName, userEmail, currentPlan, subscriptionStatus = "active", onPauseSubscription, onResumeSubscription, onCancelSubscription }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<"account" | "subscription" | "billing" | "ea-code" | "api-keys" | "referrals">("account");
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [copiedMT4, setCopiedMT4] = useState(false);
  const [copiedMT5, setCopiedMT5] = useState(false);
  const [copiedReferralCode, setCopiedReferralCode] = useState(false);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showRegenerateApiModal, setShowRegenerateApiModal] = useState(false);
  const [showUpdatePaymentModal, setShowUpdatePaymentModal] = useState(false);
  const [showMTUsernameGuide, setShowMTUsernameGuide] = useState(false);
  const [showEAInstallGuide, setShowEAInstallGuide] = useState(false);
  
  // Cancellation feedback
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState("");
  
  // Form states
  const [formData, setFormData] = useState({
    fullName: userName,
    email: userEmail,
    mtUsername: "trader_12345678",
    broker: "IC Markets"
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Mock data - replace with real data from backend
  const apiKey = "gtt_live_sk_a8f9d2e1c4b5a6f7e8d9c0b1a2f3e4d5";
  const monthlyTradesAnalysed = 142;
  const billingHistory = [
    { date: "Dec 1, 2024", amount: "£10.00", status: "Paid", invoice: "#INV-001" },
    { date: "Nov 1, 2024", amount: "£38.40", status: "Paid", invoice: "#INV-002" },
    { date: "Oct 1, 2024", amount: "£35.00", status: "Paid", invoice: "#INV-003" },
  ];

  // Referral data
  const referralCode = "TRADER-" + userName.toUpperCase().replace(/\s+/g, '').slice(0, 8) + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  const referralLink = `https://greenturtletrades.com/signup?ref=${referralCode}`;
  const totalReferrals = 3;
  const activeReferrals = 2; // Referrals still within the 2-month period
  const totalDiscounts = 20.00; // £5 x 2 active referrals x 2 months (20% of £25 = £5/month discount)
  
  // Active referral discount for current billing
  const activeReferralDiscount = 10.00; // £5 per active referral = £5 x 2 = £10.00/month
  const referralDiscountMonthsRemaining = 1; // Maximum months remaining across all active referrals
  
  const referralHistory = [
    { name: "Sarah M.", joinDate: "Jan 10, 2025", status: "Active", monthsRemaining: 1, discount: "£10.00" },
    { name: "James K.", joinDate: "Dec 15, 2024", status: "Active", monthsRemaining: 0, discount: "£10.00" },
    { name: "Michael P.", joinDate: "Nov 5, 2024", status: "Completed", monthsRemaining: 0, discount: "£10.00" },
  ];

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedReferralCode(true);
    setTimeout(() => setCopiedReferralCode(false), 2000);
  };

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedReferralLink(true);
    setTimeout(() => setCopiedReferralLink(false), 2000);
  };

  const mt4Code = `//+------------------------------------------------------------------+
//|                                        Green Turtle Trades EA.mq4 |
//|                              Copyright 2024, Green Turtle Trades |
//|                                   https://greenturtletrades.com |
//+------------------------------------------------------------------+
#property copyright "Green Turtle Trades"
#property link      "https://greenturtletrades.com"
#property version   "1.00"
#property strict

// External parameters
input string API_KEY = "YOUR_API_KEY_HERE";           // Your API Key from GTT Dashboard
input int SYNC_INTERVAL = 5;                          // Sync interval in seconds
input bool ENABLE_LIVE_SYNC = true;                   // Enable live trade syncing

// [Rest of EA code...]`;

  const mt5Code = `//+------------------------------------------------------------------+
//|                                        Green Turtle Trades EA.mq5 |
//|                              Copyright 2024, Green Turtle Trades |
//|                                   https://greenturtletrades.com |
//+------------------------------------------------------------------+
#property copyright "Green Turtle Trades"
#property link      "https://greenturtletrades.com"
#property version   "1.00"

// External parameters
input string API_KEY = "YOUR_API_KEY_HERE";           // Your API Key from GTT Dashboard
input int SYNC_INTERVAL = 5;                          // Sync interval in seconds
input bool ENABLE_LIVE_SYNC = true;                   // Enable live trade syncing

// [Rest of EA code...]`;

  const handleCopyCode = (platform: "mt4" | "mt5") => {
    const code = platform === "mt4" ? mt4Code : mt5Code;
    navigator.clipboard.writeText(code);
    if (platform === "mt4") {
      setCopiedMT4(true);
      setTimeout(() => setCopiedMT4(false), 2000);
    } else {
      setCopiedMT5(true);
      setTimeout(() => setCopiedMT5(false), 2000);
    }
  };

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "subscription", label: "Subscription", icon: Sparkles },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "ea-code", label: "EA Code", icon: Code },
    { id: "api-keys", label: "API Keys", icon: Key },
    { id: "referrals", label: "Referrals", icon: Gift },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-teal-600" />
            <div>
              <h1 className="text-slate-900 text-2xl sm:text-3xl">Settings</h1>
              <p className="text-slate-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      activeTab === tab.id
                        ? "bg-teal-50 text-teal-700 border-l-4 border-teal-600"
                        : "text-slate-700 hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              
              {/* Account Tab */}
              {activeTab === "account" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-slate-900 mb-4 text-xl">Account Information</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2">MetaTrader ID</label>
                      <input
                        type="text"
                        value={formData.mtUsername}
                        onChange={(e) => setFormData({ ...formData, mtUsername: e.target.value })}
                        placeholder="Enter your MT4/MT5 ID"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <p className="text-slate-500 text-sm mt-1">
                        This is your login ID from MetaTrader (used to connect to your broker)
                      </p>
                      <button
                        onClick={() => setShowMTUsernameGuide(true)}
                        className="text-teal-600 hover:text-teal-700 text-sm"
                      >
                        How to find your MetaTrader ID
                      </button>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2">Broker Name</label>
                      <input
                        type="text"
                        value={formData.broker}
                        onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                        placeholder="e.g., IC Markets, OANDA, Pepperstone"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <p className="text-slate-500 text-sm mt-1">
                        Your broker name helps us verify trade data accuracy
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2">Password</label>
                      <button
                        onClick={() => setShowChangePasswordModal(true)}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Change Password
                      </button>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => {
                          // Save account changes
                          alert(`Account updated!\nName: ${formData.fullName}\nEmail: ${formData.email}\nMT Username: ${formData.mtUsername}\nBroker: ${formData.broker}`);
                        }}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6 mt-6">
                    <h3 className="text-slate-900 mb-2">Danger Zone</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Permanently delete your account and all associated data
                    </p>
                    <button
                      onClick={() => setShowDeleteAccountModal(true)}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === "subscription" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-slate-900 mb-4 text-xl">Subscription Plan</h2>
                  </div>

                  {/* Current Plan */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-teal-600" />
                          <h3 className="text-slate-900 text-lg">
                            Pay-As-You-Go
                          </h3>
                        </div>
                        <p className="text-slate-600 text-sm">
                          £25/month + £0.20 per trade analysed
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        subscriptionStatus === "paused"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-teal-600 text-white"
                      }`}>
                        {subscriptionStatus === "paused" ? "Paused" : "Active"}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-600 text-sm">Trades analysed this month</p>
                          <p className="text-slate-900 text-2xl mt-1">{monthlyTradesAnalysed}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-600 text-sm">Estimated cost</p>
                          <p className="text-slate-900 text-2xl mt-1">
                            £{(10 + monthlyTradesAnalysed * 0.2).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Referral Discount Highlight */}
                    {activeReferralDiscount > 0 && (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <Gift className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-emerald-900 font-medium mb-1">Referral Discount Active!</h4>
                            <p className="text-emerald-700 text-sm mb-3">
                              You're saving £{activeReferralDiscount.toFixed(2)}/month from {activeReferrals} active referral{activeReferrals > 1 ? 's' : ''}
                              {referralDiscountMonthsRemaining > 0 && (
                                <span> • {referralDiscountMonthsRemaining} month{referralDiscountMonthsRemaining > 1 ? 's' : ''} remaining</span>
                              )}
                            </p>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center justify-between text-slate-600">
                                <span>Base subscription</span>
                                <span>£25.00</span>
                              </div>
                              <div className="flex items-center justify-between text-emerald-700 font-medium">
                                <span>Referral discount</span>
                                <span>-£{activeReferralDiscount.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-900 font-medium pt-1 border-t border-emerald-200">
                                <span>Next billing amount</span>
                                <span>£{(25 - activeReferralDiscount).toFixed(2)}</span>
                              </div>
                              <p className="text-xs text-slate-500 pt-1">+ trade analysis costs</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-slate-600">
                      <p>Next billing date: <span className="text-slate-900">January 27, 2025</span></p>
                    </div>
                  </div>



                  {/* Pause/Resume Subscription */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-slate-900 mb-2">
                      {subscriptionStatus === "paused" ? "Resume Subscription" : "Going on a Break?"}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4">
                      {subscriptionStatus === "paused" 
                        ? "Ready to come back? Restart your subscription and continue where you left off."
                        : "Pause your subscription and ML analysis. All services will cease at the end of your current billing cycle. You can resume anytime."
                      }
                    </p>
                    {subscriptionStatus === "paused" ? (
                      <button
                        onClick={onResumeSubscription}
                        className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                      >
                        Let's Start Again
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPauseModal(true)}
                        className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        Pause Subscription
                      </button>
                    )}
                  </div>

                  {/* Cancel Subscription */}
                  <div className="border-t border-slate-200 pt-6 mt-6">
                    <h3 className="text-slate-900 mb-2">Cancel Subscription</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                    </p>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === "billing" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-slate-900 mb-4 text-xl">Billing & Invoices</h2>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="text-slate-900 mb-3">Payment Method</h3>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-6 h-6 text-slate-600" />
                          <div>
                            <p className="text-slate-900">•••• •••• •••• 4242</p>
                            <p className="text-slate-600 text-sm">Expires 12/25</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowUpdatePaymentModal(true)}
                          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div>
                    <h3 className="text-slate-900 mb-3">Billing History</h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-slate-700 text-sm">Date</th>
                            <th className="text-left px-4 py-3 text-slate-700 text-sm">Amount</th>
                            <th className="text-left px-4 py-3 text-slate-700 text-sm">Status</th>
                            <th className="text-left px-4 py-3 text-slate-700 text-sm">Invoice</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingHistory.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 last:border-b-0">
                              <td className="px-4 py-3 text-slate-900">{item.date}</td>
                              <td className="px-4 py-3 text-slate-900">{item.amount}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-green-50 text-green-700 text-sm rounded">
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button className="text-teal-600 hover:text-teal-700 text-sm">
                                  Download {item.invoice}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* EA Code Tab */}
              {activeTab === "ea-code" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-slate-900 mb-2 text-xl">MetaTrader EA Code</h2>
                    <p className="text-slate-600">
                      Download or copy the Expert Advisor code to sync your trades with Green Turtle Trades
                    </p>
                  </div>

                  {/* MT4 Code */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-teal-400" />
                        <span>MetaTrader 4 (MT4) - GreenTurtleTradesEA.mq4</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const blob = new Blob([mt4Code], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'GreenTurtleTradesEA.mq4';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => handleCopyCode("mt4")}
                          className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded text-sm transition-colors"
                        >
                          {copiedMT4 ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-900 max-h-64 overflow-y-auto">
                      <pre className="text-sm text-slate-300 font-mono">
                        <code>{mt4Code}</code>
                      </pre>
                    </div>
                  </div>

                  {/* MT5 Code */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-teal-400" />
                        <span>MetaTrader 5 (MT5) - GreenTurtleTradesEA.mq5</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const blob = new Blob([mt5Code], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'GreenTurtleTradesEA.mq5';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => handleCopyCode("mt5")}
                          className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded text-sm transition-colors"
                        >
                          {copiedMT5 ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-900 max-h-64 overflow-y-auto">
                      <pre className="text-sm text-slate-300 font-mono">
                        <code>{mt5Code}</code>
                      </pre>
                    </div>
                  </div>

                  {/* Installation Guide Button */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-blue-800 text-sm">
                        Need help installing the EA? View the full installation guide with step-by-step instructions.
                      </p>
                      <button
                        onClick={() => setShowEAInstallGuide(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap ml-4"
                      >
                        Installation Guide
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* API Keys Tab */}
              {activeTab === "api-keys" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-slate-900 mb-2 text-xl">API Keys</h2>
                    <p className="text-slate-600">
                      Use this API key to connect your MetaTrader EA to Green Turtle Trades
                    </p>
                  </div>

                  {/* API Key Display */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-slate-700 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Live API Key
                      </label>
                      <button
                        onClick={handleCopyApiKey}
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors text-sm"
                      >
                        {copiedApiKey ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-slate-900 rounded px-4 py-3 font-mono text-sm text-slate-300">
                      {apiKey}
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-amber-900 mb-1">Keep Your API Key Secret</h3>
                        <p className="text-amber-800 text-sm">
                          Never share your API key publicly or include it in shared code. If you believe your key has been compromised, regenerate it immediately.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Regenerate Button */}
                  <div>
                    <button
                      onClick={() => setShowRegenerateApiModal(true)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Regenerate API Key
                    </button>
                    <p className="text-slate-500 text-sm mt-2">
                      This will invalidate your current API key and you'll need to update it in your EA
                    </p>
                  </div>
                </div>
              )}

              {/* Referrals Tab */}
              {activeTab === "referrals" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-slate-900 mb-2 text-xl">Referral Programme</h2>
                    <p className="text-slate-600">
                      Invite traders to Green Turtle Trades and receive discounts for both of you
                    </p>
                  </div>

                  {/* Referral Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-teal-600" />
                        <span className="text-slate-700 text-sm">Total Referrals</span>
                      </div>
                      <div className="text-2xl text-slate-900">{totalReferrals}</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        <span className="text-slate-700 text-sm">Active Referrals</span>
                      </div>
                      <div className="text-2xl text-slate-900">{activeReferrals}</div>
                    </div>
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-5 h-5 text-teal-600" />
                        <span className="text-slate-700 text-sm">Total Discounts Received</span>
                      </div>
                      <div className="text-2xl text-slate-900">£{totalDiscounts.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* How It Works */}
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <h3 className="text-teal-900 mb-3 flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      How It Works
                    </h3>
                    <ul className="space-y-2 text-sm text-teal-800">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Share your referral code or link with other traders</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>When they sign up and subscribe, they get <strong>20% off</strong> their subscription for 2 months (£20/month instead of £25/month)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>You also receive a <strong>20% discount</strong> (£5/month off) for 2 months on your subscription</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Discounts are automatically applied to your monthly bill</span>
                      </li>
                    </ul>
                  </div>

                  {/* Referral Code */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-slate-700 flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Your Referral Code
                      </label>
                      <button
                        onClick={handleCopyReferralCode}
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors text-sm"
                      >
                        {copiedReferralCode ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Code
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-slate-900 rounded px-4 py-3 font-mono text-sm text-slate-300">
                      {referralCode}
                    </div>
                  </div>

                  {/* Referral Link */}
                  <div className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-slate-700 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Your Referral Link
                      </label>
                      <button
                        onClick={handleCopyReferralLink}
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors text-sm"
                      >
                        {copiedReferralLink ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-slate-900 rounded px-4 py-3 font-mono text-xs text-slate-300 break-all">
                      {referralLink}
                    </div>
                  </div>

                  {/* Referral History */}
                  <div>
                    <h3 className="text-slate-900 mb-3">Referral History</h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-slate-700 text-sm">Trader</th>
                            <th className="text-left px-4 py-3 text-slate-700 text-sm">Join Date</th>
                            <th className="text-left px-4 py-3 text-slate-700 text-sm">Status</th>
                            <th className="text-left px-4 py-3 text-slate-700 text-sm">Months Remaining</th>
                            <th className="text-right px-4 py-3 text-slate-700 text-sm">Discount Received</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralHistory.map((referral, index) => (
                            <tr key={index} className="border-b border-slate-100 last:border-0">
                              <td className="px-4 py-3 text-slate-900">{referral.name}</td>
                              <td className="px-4 py-3 text-slate-600 text-sm">{referral.joinDate}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                                  referral.status === "Active" 
                                    ? "bg-teal-100 text-teal-700" 
                                    : "bg-slate-100 text-slate-600"
                                }`}>
                                  {referral.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 text-sm">
                                {referral.monthsRemaining > 0 ? `${referral.monthsRemaining} month${referral.monthsRemaining > 1 ? 's' : ''}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-900">{referral.discount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Pause Subscription Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-slate-900 text-xl">Pause Subscription?</h3>
              </div>
              <button onClick={() => setShowPauseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-slate-600">
                Your subscription and ML analysis will pause from the next billing cycle (January 27, 2025).
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-amber-900 text-sm mb-2">What happens when paused:</h4>
                <ul className="text-amber-800 text-sm space-y-1">
                  <li>• ML analysis stops</li>
                  <li>• No charges until you resume</li>
                  <li>• Your data is safely stored</li>
                  <li>• Resume anytime</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPauseModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Keep Active
              </button>
              <button
                onClick={() => {
                  onPauseSubscription && onPauseSubscription();
                  setShowPauseModal(false);
                }}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Pause Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal with Feedback */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-slate-200 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-slate-900 text-xl">We're Sorry to See You Go</h3>
                </div>
                <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="px-6 pt-4 pb-6">{/* Content wrapper */}
            
            <p className="text-slate-600 mb-6">
              Before you go, help us improve by letting us know why you're cancelling.
            </p>

            {/* Cancellation Reasons */}
            <div className="space-y-3 mb-6">
              <label className="text-slate-900 text-sm mb-2 block">
                What's the main reason for cancelling?
              </label>
              
              {[
                { value: "too-expensive", label: "Too expensive" },
                { value: "not-using", label: "Not using it enough" },
                { value: "technical-issues", label: "Technical issues or bugs" },
                { value: "missing-features", label: "Missing features I need" },
                { value: "found-alternative", label: "Found a better alternative" },
                { value: "temporary-break", label: "Taking a temporary break from trading" },
                { value: "results-not-helpful", label: "Analysis results not helpful" },
                { value: "too-complex", label: "Too complex to use" },
                { value: "other", label: "Other reason" }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    cancelReason === option.value
                      ? "border-teal-600 bg-teal-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={option.value}
                    checked={cancelReason === option.value}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="text-slate-900 text-sm">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Additional Feedback */}
            <div className="mb-6">
              <label className="text-slate-900 text-sm mb-2 block">
                Any additional feedback? (Optional)
              </label>
              <textarea
                value={cancelFeedback}
                onChange={(e) => setCancelFeedback(e.target.value)}
                placeholder="Tell us more about your experience..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setCancelFeedback("");
                }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => {
                  if (!cancelReason) {
                    alert("Please select a reason for cancellation");
                    return;
                  }
                  onCancelSubscription(cancelReason, cancelFeedback);
                  setShowCancelModal(false);
                  setCancelReason("");
                  setCancelFeedback("");
                }}
                disabled={!cancelReason}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  cancelReason
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                Confirm Cancellation
              </button>
            </div>

            {/* Helpful Note */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-900 text-xs">
                💡 <strong>Did you know?</strong> You can pause your subscription instead of cancelling. 
                This keeps your data safe and lets you resume anytime.
              </p>
            </div>
            </div>{/* End content wrapper */}
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-slate-900 text-xl">Delete Account?</h3>
            </div>
            
            <p className="text-slate-600 mb-6">
              Are you sure you want to permanently delete your account? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add delete account logic here
                  setShowDeleteAccountModal(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Key className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-slate-900 text-xl">Change Password</h3>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Add change password logic here
                    setShowChangePasswordModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regenerate API Key Modal */}
      {showRegenerateApiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Key className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-slate-900 text-xl">Regenerate API Key</h3>
            </div>
            
            <p className="text-slate-600 mb-6">
              Are you sure you want to regenerate your API key? This will invalidate your current key and you'll need to update it in your EA.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenerateApiModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add regenerate API key logic here
                  setShowRegenerateApiModal(false);
                }}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Regenerate Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Payment Method Modal */}
      {showUpdatePaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-slate-900 text-xl">Update Payment Method</h3>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">Card Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-slate-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="w-1/2">
                  <label className="block text-slate-700 mb-2">CVV</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpdatePaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Add update payment method logic here
                    setShowUpdatePaymentModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Update Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MetaTrader ID Guide Modal */}
      {showMTUsernameGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 my-8">
            <div className="flex items-start justify-between mb-6 sticky top-0 bg-white z-10 pb-4 -mt-6 pt-6 -mx-6 px-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 text-xl">How to Find Your MetaTrader ID</h3>
                  <p className="text-slate-600 text-sm">Step-by-step guide for MT4 and MT5</p>
                </div>
              </div>
              <button
                onClick={() => setShowMTUsernameGuide(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* What is MetaTrader ID */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-blue-900 mb-2">What is a MetaTrader ID?</h4>
                <p className="text-blue-800 text-sm">
                  Your MetaTrader ID is the login credential you use to access your trading account. It's typically a number or combination of letters and numbers (e.g., 12345678, trader_12345, or MT5_98765432).
                </p>
              </div>

              {/* Method 1: Find in Open Platform */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-sm">1</span>
                    Method 1: Check Your Current Login
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Open your MetaTrader 4 or MetaTrader 5 platform</p>
                      <p className="text-slate-600 text-sm">Make sure you're logged in to your trading account</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Look at the bottom-left corner of the platform</p>
                      <p className="text-slate-600 text-sm">You'll see your account number displayed (this is your username)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Alternative: Click "Tools" → "Options" → "Server" tab</p>
                      <p className="text-slate-600 text-sm">Your login/username will be displayed at the top</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Method 2: Check Welcome Email */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-sm">2</span>
                    Method 2: Check Your Broker's Welcome Email
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Search your email inbox for messages from your broker</p>
                      <p className="text-slate-600 text-sm">Look for subject lines like "Account Created" or "Trading Account Details"</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Your username should be listed as:</p>
                      <p className="text-slate-600 text-sm">"Login", "Account Number", "Username", or "MT4/MT5 Login"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Method 3: Broker Client Portal */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-sm">3</span>
                    Method 3: Check Your Broker's Client Portal
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Log in to your broker's website or client portal</p>
                      <p className="text-slate-600 text-sm">e.g., IC Markets Client Area, OANDA fxTrade, Pepperstone Client Portal</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Navigate to "My Accounts" or "Account Details"</p>
                      <p className="text-slate-600 text-sm">Your MetaTrader ID will be displayed for each trading account</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Examples */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-slate-900 mb-3">Common Username Formats:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-600">✓</span>
                    <code className="bg-slate-200 px-2 py-1 rounded text-slate-900">12345678</code>
                    <span className="text-slate-600">- Pure numbers (most common)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-600">✓</span>
                    <code className="bg-slate-200 px-2 py-1 rounded text-slate-900">trader_87654321</code>
                    <span className="text-slate-600">- Letters and numbers with underscore</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-600">✓</span>
                    <code className="bg-slate-200 px-2 py-1 rounded text-slate-900">MT5_98765432</code>
                    <span className="text-slate-600">- Platform prefix + numbers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-600">✓</span>
                    <code className="bg-slate-200 px-2 py-1 rounded text-slate-900">ICM12345678</code>
                    <span className="text-slate-600">- Broker code + numbers</span>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-amber-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Important Notes
                </h4>
                <ul className="text-amber-800 text-sm space-y-1 list-disc pl-5">
                  <li>Your username is <strong>NOT</strong> the same as your email address</li>
                  <li>Your username is <strong>NOT</strong> the same as your broker portal password</li>
                  <li>Each trading account has its own unique username</li>
                  <li>If you have multiple accounts (demo, live), make sure you're using the correct one</li>
                </ul>
              </div>

              {/* Contact Broker */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="text-slate-900 mb-2">Still Can't Find Your ID?</h4>
                <p className="text-slate-600 text-sm mb-3">
                  Contact your broker's support team directly. They can help you locate your MetaTrader ID instantly.
                </p>
                <p className="text-slate-600 text-sm">
                  <strong>Common broker support contacts:</strong>
                </p>
                <ul className="text-slate-600 text-sm list-disc pl-5 mt-2 space-y-1">
                  <li>IC Markets: support@icmarkets.com or live chat</li>
                  <li>OANDA: customerservice@oanda.com</li>
                  <li>Pepperstone: support@pepperstone.com</li>
                  <li>Check your broker's website for specific support details</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMTUsernameGuide(false)}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Got It, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EA Installation Guide Modal */}
      {showEAInstallGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 my-8">
            <div className="flex items-start justify-between mb-6 sticky top-0 bg-white z-10 pb-[16px] -mt-6 pt-[30px] -mx-6 px-6 pr-[24px] pl-[24px]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Code className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-slate-900 text-xl">EA Installation Guide</h3>
                  <p className="text-slate-600 text-sm">Complete step-by-step installation for MT4 and MT5</p>
                </div>
              </div>
              <button
                onClick={() => setShowEAInstallGuide(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* What You'll Need */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-blue-900 mb-2">What You'll Need Before Starting:</h4>
                <ul className="text-blue-800 text-sm space-y-1 list-disc pl-5">
                  <li>MetaTrader 4 or MetaTrader 5 installed on your computer</li>
                  <li>Your Green Turtle Trades API Key (from the API Keys tab)</li>
                  <li>Active trading account with your broker</li>
                  <li>The EA file downloaded from above (GreenTurtleTradesEA.mq4 or .mq5)</li>
                </ul>
              </div>

              {/* Step 1: Download EA File */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-sm">1</span>
                    Download the EA File
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Scroll up to the EA Code section on this page</p>
                      <p className="text-slate-600 text-sm">Choose MT4 (.mq4) or MT5 (.mq5) based on your platform</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Click the "Download" button</p>
                      <p className="text-slate-600 text-sm">The file will be saved to your Downloads folder</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Locate MetaTrader Data Folder */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-sm">2</span>
                    Locate Your MetaTrader Data Folder
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Open your MetaTrader platform (MT4 or MT5)</p>
                      <p className="text-slate-600 text-sm">Make sure it's fully loaded and connected</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Click "File" → "Open Data Folder"</p>
                      <p className="text-slate-600 text-sm">This will open your MetaTrader's data directory in File Explorer/Finder</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded p-3 mt-2">
                    <p className="text-slate-700 text-sm mb-1">The path typically looks like:</p>
                    <code className="text-xs text-slate-600 block">
                      C:\Users\YourName\AppData\Roaming\MetaQuotes\Terminal\[ID]\MQL4 (or MQL5)
                    </code>
                  </div>
                </div>
              </div>

              {/* Step 3: Copy EA to Experts Folder */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-sm">3</span>
                    Copy EA to Experts Folder
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">In the Data Folder, navigate to: <code className="bg-slate-100 px-2 py-0.5 rounded text-sm">MQL4/Experts</code> or <code className="bg-slate-100 px-2 py-0.5 rounded text-sm">MQL5/Experts</code></p>
                      <p className="text-slate-600 text-sm">Depending on which platform you're using</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Copy the downloaded EA file into this folder</p>
                      <p className="text-slate-600 text-sm">Drag and drop or copy-paste the .mq4 or .mq5 file</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Compile the EA */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-sm">4</span>
                    Compile the EA (Optional but Recommended)
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">In MetaTrader, press <kbd className="bg-slate-200 px-2 py-0.5 rounded text-sm">F4</kbd> or click "Tools" → "MetaQuotes Language Editor"</p>
                      <p className="text-slate-600 text-sm">This opens the MQL editor</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">In the Navigator panel, find "Experts" → "GreenTurtleTradesEA"</p>
                      <p className="text-slate-600 text-sm">Double-click to open the file</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Click "Compile" button or press <kbd className="bg-slate-200 px-2 py-0.5 rounded text-sm">F7</kbd></p>
                      <p className="text-slate-600 text-sm">Check for "0 error(s), 0 warning(s)" in the bottom panel</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Refresh Navigator */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-sm">5</span>
                    Refresh MetaTrader Navigator
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Go back to your main MetaTrader platform window</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Right-click in the "Navigator" panel and select "Refresh"</p>
                      <p className="text-slate-600 text-sm">Or simply restart MetaTrader</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">You should now see "GreenTurtleTradesEA" under "Expert Advisors"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 6: Configure EA Settings */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-sm">6</span>
                    Configure EA Settings with Your API Key
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">In Navigator, find "Expert Advisors" → "GreenTurtleTradesEA"</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Drag and drop it onto any chart window</p>
                      <p className="text-slate-600 text-sm">A settings dialog will appear</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Go to the "Inputs" tab</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Find the "API_KEY" field and paste your API key from the API Keys tab</p>
                      <p className="text-slate-600 text-sm">Make sure to copy it exactly - no extra spaces!</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-2">
                    <p className="text-amber-900 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <strong>Important:</strong> Go to the API Keys tab above to copy your unique API key
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 7: Enable AutoTrading */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-sm">7</span>
                    Enable AutoTrading & Allow DLL Imports
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">In the EA settings dialog, go to the "Common" tab</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Check the following boxes:</p>
                      <ul className="list-disc pl-5 text-slate-600 text-sm mt-1 space-y-1">
                        <li>✅ Allow live trading</li>
                        <li>✅ Allow DLL imports (required for API communication)</li>
                        <li>✅ Allow WebRequest for listed URL (if applicable)</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Click "OK" to attach the EA to your chart</p>
                      <p className="text-slate-600 text-sm">You'll see a smiley face icon in the top-right corner of the chart</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Make sure the "AutoTrading" button in the toolbar is enabled (green)</p>
                      <p className="text-slate-600 text-sm">If it's red, click it to turn on AutoTrading</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 8: Verify Connection */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h4 className="flex items-center gap-2">
                    <span className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-sm">8</span>
                    Verify Connection to Green Turtle Trades
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Open the "Experts" tab in the Terminal window (bottom of MT platform)</p>
                      <p className="text-slate-600 text-sm">Press Ctrl+T if the Terminal is not visible</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Look for connection confirmation messages like:</p>
                      <code className="block bg-slate-50 p-2 rounded text-xs text-green-700 mt-1">
                        "Green Turtle Trades EA: Connected successfully"<br/>
                        "API Key validated - Ready to sync trades"
                      </code>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-700 text-sm">•</span>
                    </div>
                    <div>
                      <p className="text-slate-900">Check your Green Turtle Trades dashboard</p>
                      <p className="text-slate-600 text-sm">Your trades should start appearing within 5-10 seconds</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Indicator */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-green-900 mb-2 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Installation Complete!
                </h4>
                <p className="text-green-800 text-sm">
                  Your EA is now installed and syncing trades to Green Turtle Trades. All your trades will be automatically analysed by our Turtle Analytics system.
                </p>
              </div>

              {/* Troubleshooting */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-slate-900 mb-3">Common Issues & Solutions:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">❌</span>
                    <div>
                      <p className="text-slate-900"><strong>EA doesn't appear in Navigator:</strong></p>
                      <p className="text-slate-600">Make sure you placed it in the correct Experts folder and refreshed or restarted MT</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">❌</span>
                    <div>
                      <p className="text-slate-900"><strong>"Invalid API Key" error:</strong></p>
                      <p className="text-slate-600">Double-check you copied the full API key from the API Keys tab with no extra spaces</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">❌</span>
                    <div>
                      <p className="text-slate-900"><strong>Sad face emoji on chart:</strong></p>
                      <p className="text-slate-600">DLL imports not allowed - go back to Step 7 and enable "Allow DLL imports"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">❌</span>
                    <div>
                      <p className="text-slate-900"><strong>Trades not syncing:</strong></p>
                      <p className="text-slate-600">Check AutoTrading is enabled (green button) and your internet connection is stable</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Need More Help */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="text-slate-900 mb-2">Still Need Help?</h4>
                <p className="text-slate-600 text-sm">
                  Contact our support team at <a href="mailto:contact@greenturtletraders.co.uk" className="text-teal-600 hover:underline">contact@greenturtletraders.co.uk</a>.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEAInstallGuide(false)}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Got It, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}