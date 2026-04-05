import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  Gift,
  Key,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  User,
  Code,
  Activity,
} from "lucide-react";
import { me } from "../api/auth";
import {
  createBillingPortalSession,
  changeTraderPassword,
  createApiKey,
  createBrokerAccount,
  deleteMyAccount,
  downloadEaFile,
  fetchBillingSummary,
  fetchEaDiagnostics,
  fetchEaStatus,
  fetchApiKeys,
  fetchBrokerAccounts,
  revokeApiKey,
  updateBrokerAccount,
  updateProfile,
  type ApiKeyRecord,
  type BillingSummaryResponse,
  type BrokerAccount,
  type EaDiagnosticsResponse,
  type EaStatusResponse,
} from "../api/settings";
import { clearStoredToken } from "../api/client";

interface SettingsPageProps {
  userName: string;
  userEmail: string;
  currentPlan: "payg";
  subscriptionStatus?: "active" | "paused" | "cancelling" | "not_started" | "trialing";
  onPauseSubscription?: () => void;
  onResumeSubscription?: () => void;
  onCancelSubscription: (reason: string, feedback: string) => void;
}

function getFullName(firstName?: string | null, lastName?: string | null) {
  return `${firstName || ""} ${lastName || ""}`.trim();
}

export function SettingsPage({
  userName,
  userEmail,
  currentPlan,
  subscriptionStatus = "active",
  onPauseSubscription,
  onResumeSubscription,
  onCancelSubscription,
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<
    "account" | "subscription" | "ea-code" | "api-keys" | "referrals"
  >("account");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: userName,
    email: userEmail,
    mtUsername: "",
    broker: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [freshApiKey, setFreshApiKey] = useState<string | null>(null);
  const [creatingApiKey, setCreatingApiKey] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [regeneratingApiKeyId, setRegeneratingApiKeyId] = useState<string | null>(null);
  const [downloadingEaPlatform, setDownloadingEaPlatform] = useState<"MT4" | "MT5" | null>(null);
  const [eaStatus, setEaStatus] = useState<EaStatusResponse | null>(null);
  const [eaDiagnostics, setEaDiagnostics] = useState<EaDiagnosticsResponse | null>(null);
  const [billingSummary, setBillingSummary] = useState<BillingSummaryResponse["billing"] | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [openingBillingPortal, setOpeningBillingPortal] = useState(false);
  const [refreshingEaHealth, setRefreshingEaHealth] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState("");

  const primaryBrokerAccount = brokerAccounts[0] || null;
  const activeApiKeys = apiKeys.filter((item) => !item.revokedAt);
  const managedEaApiKey = activeApiKeys.find((item) => item.name === "MetaTrader EA") || null;
  const currentApiKey = freshApiKey || null;

  const referralCode = useMemo(() => {
    const baseName = (formData.fullName || userName || "TRADER").replace(/\s+/g, "").toUpperCase().slice(0, 8);
    return `TRADER-${baseName || "TRADER"}`;
  }, [formData.fullName, userName]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [session, brokerResponse, apiKeyResponse, eaStatusResponse, eaDiagnosticsResponse, billingResponse] = await Promise.all([
          me(),
          fetchBrokerAccounts(),
          fetchApiKeys(),
          fetchEaStatus(),
          fetchEaDiagnostics(),
          fetchBillingSummary(),
        ]);

        if (cancelled) return;

        const liveName = getFullName(session.user.profile?.firstName, session.user.profile?.lastName);
        const firstBroker = brokerResponse.brokerAccounts[0] || null;

        setFormData({
          fullName: liveName || userName,
          email: session.user.email || userEmail,
          mtUsername: firstBroker?.accountNumber || "",
          broker: firstBroker?.brokerName || "",
        });
        setBrokerAccounts(brokerResponse.brokerAccounts);
        setApiKeys(apiKeyResponse.apiKeys);
        setEaStatus(eaStatusResponse);
        setEaDiagnostics(eaDiagnosticsResponse);
        setBillingSummary(billingResponse.billing);
        setPageError(null);
      } catch (error) {
        if (!cancelled) {
          setPageError(error instanceof Error ? error.message : "Unable to load settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setBillingLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userEmail, userName]);

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "subscription", label: "Subscription & Billing", icon: CreditCard },
    { id: "ea-code", label: "EA Code", icon: Code },
    { id: "api-keys", label: "API Keys", icon: Key },
    { id: "referrals", label: "Referrals", icon: Gift },
  ] as const;

  const setTransientSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleCopy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(label);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    setPageError(null);

    try {
      await updateProfile(formData.fullName, formData.email);

      if (formData.mtUsername.trim()) {
        if (primaryBrokerAccount) {
          const response = await updateBrokerAccount(primaryBrokerAccount.id, {
            accountNumber: formData.mtUsername.trim(),
            brokerName: formData.broker.trim(),
            label: primaryBrokerAccount.label || "Primary MetaTrader",
            platform: primaryBrokerAccount.platform,
            isActive: true,
          });
          setBrokerAccounts((current) =>
            current.map((item) => (item.id === response.brokerAccount.id ? response.brokerAccount : item))
          );
        } else {
          const response = await createBrokerAccount({
            platform: "MT5",
            accountNumber: formData.mtUsername.trim(),
            brokerName: formData.broker.trim(),
            label: "Primary MetaTrader",
            isActive: true,
          });
          setBrokerAccounts((current) => [response.brokerAccount, ...current]);
        }
      }

      setTransientSuccess("Settings saved.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setSavingAccount(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPageError("Both password fields are required.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPageError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    setPageError(null);
    try {
      await changeTraderPassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTransientSuccess("Password updated.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCreateApiKey = async () => {
    setCreatingApiKey(true);
    setPageError(null);
    try {
      const response = await createApiKey("MetaTrader EA");
      setApiKeys((current) => [response.apiKey, ...current]);
      setFreshApiKey(response.apiKey.key);
      setTransientSuccess("New API key created.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to create API key.");
    } finally {
      setCreatingApiKey(false);
    }
  };

  const handleDownloadEa = async (platform: "MT4" | "MT5") => {
    setDownloadingEaPlatform(platform);
    setPageError(null);

    try {
      const response = await downloadEaFile(platform);
      const blob = new Blob([response.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.filename;
      anchor.click();
      URL.revokeObjectURL(url);

      const [brokerResponse, apiKeyResponse, eaStatusResponse, eaDiagnosticsResponse] = await Promise.all([
        fetchBrokerAccounts(),
        fetchApiKeys(),
        fetchEaStatus(),
        fetchEaDiagnostics(),
      ]);

      setBrokerAccounts(brokerResponse.brokerAccounts);
      setApiKeys(apiKeyResponse.apiKeys);
      setEaStatus(eaStatusResponse);
      setEaDiagnostics(eaDiagnosticsResponse);
      setSuccessMessage(`Downloaded ${platform} EA linked to API key ending ${response.apiKeyLast4}.`);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to generate the EA download.");
    } finally {
      setDownloadingEaPlatform(null);
    }
  };

  const handleRefreshEaHealth = async () => {
    setRefreshingEaHealth(true);
    setPageError(null);
    try {
      const [eaStatusResponse, eaDiagnosticsResponse] = await Promise.all([
        fetchEaStatus(),
        fetchEaDiagnostics(),
      ]);
      setEaStatus(eaStatusResponse);
      setEaDiagnostics(eaDiagnosticsResponse);
      setTransientSuccess("EA health refreshed.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to refresh EA health.");
    } finally {
      setRefreshingEaHealth(false);
    }
  };

  const formatTimestamp = (value: string | null) => {
    if (!value) return "Not seen yet";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not seen yet";
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (value: number | null, currency: string | null = "GBP") => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    const normalizedCurrency = typeof currency === "string" && currency ? currency.toUpperCase() : "GBP";
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: normalizedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `£${value.toFixed(2)}`;
    }
  };

  const formatBillingMethod = () => {
    const method = billingSummary?.currentBillingMethod;
    if (!method?.brand || !method?.last4) return "No payment method on file";
    const brand = method.brand.charAt(0).toUpperCase() + method.brand.slice(1);
    const expiry =
      method.expMonth && method.expYear ? ` • Expires ${String(method.expMonth).padStart(2, "0")}/${method.expYear}` : "";
    return `${brand} ending ${method.last4}${expiry}`;
  };

  const liveSubscriptionStatus = (() => {
    if (billingSummary?.subscriptionStatus) {
      const status = billingSummary.subscriptionStatus.toLowerCase();
      if (status === "active" || status === "trialing") return "active";
      if (status === "paused") return "paused";
      return status;
    }
    return subscriptionStatus;
  })();

  const handleUpdateBillingMethod = async () => {
    setOpeningBillingPortal(true);
    setPageError(null);
    try {
      const response = await createBillingPortalSession();
      window.location.assign(response.url);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to open secure billing portal.");
      setOpeningBillingPortal(false);
    }
  };

  const eaHealthTone = eaStatus?.eaConnected
    ? {
        badge: "Live",
        badgeClass: "bg-emerald-100 text-emerald-700",
        panelClass: "border-emerald-200 bg-emerald-50",
        copy: "The EA is connected and sending telemetry.",
      }
    : eaStatus?.eaLastSeenAt
      ? {
          badge: "Offline",
          badgeClass: "bg-amber-100 text-amber-700",
          panelClass: "border-amber-200 bg-amber-50",
          copy: "The EA was seen before, but it is not currently connected.",
        }
      : {
          badge: "Not Connected",
          badgeClass: "bg-slate-200 text-slate-700",
          panelClass: "border-slate-200 bg-slate-50",
          copy: "No EA telemetry has reached the backend yet.",
        };

  const handleRevokeApiKey = async (id: string) => {
    setRegeneratingApiKeyId(id);
    setPageError(null);
    try {
      await revokeApiKey(id);
      setApiKeys((current) => current.map((item) => (item.id === id ? { ...item, revokedAt: new Date().toISOString() } : item)));
      setTransientSuccess("API key revoked.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to revoke API key.");
    } finally {
      setRegeneratingApiKeyId(null);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setPageError(null);
    try {
      await deleteMyAccount();
      clearStoredToken();
      window.location.href = "/";
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete account.");
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-teal-600" />
            <div>
              <h1 className="text-2xl text-slate-900 sm:text-3xl">Settings</h1>
              <p className="text-slate-600">Manage your account and live trading connections</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {pageError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 transition-colors ${
                      activeTab === tab.id
                        ? "border-l-teal-600 bg-teal-50 text-teal-700"
                        : "border-l-transparent text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              {loading ? (
                <div className="py-12 text-center text-sm text-slate-600">Loading settings...</div>
              ) : (
                <>
                  {activeTab === "account" && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-xl text-slate-900">Account Information</h2>
                        <p className="mt-1 text-sm text-slate-600">These fields save directly to your trader account.</p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-slate-700">Full Name</label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData((current) => ({ ...current, fullName: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-slate-700">Email Address</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData((current) => ({ ...current, email: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-slate-700">MetaTrader ID</label>
                          <input
                            type="text"
                            value={formData.mtUsername}
                            onChange={(e) => setFormData((current) => ({ ...current, mtUsername: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Your MT4/MT5 account login"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-slate-700">Broker Name</label>
                          <input
                            type="text"
                            value={formData.broker}
                            onChange={(e) => setFormData((current) => ({ ...current, broker: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="e.g. IC Markets"
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-slate-900">Change Password</h3>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData((current) => ({ ...current, currentPassword: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Current password"
                          />
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData((current) => ({ ...current, newPassword: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="New password"
                          />
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData((current) => ({ ...current, confirmPassword: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Confirm new password"
                          />
                        </div>
                        <button
                          onClick={handlePasswordChange}
                          disabled={changingPassword}
                          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {changingPassword ? "Updating..." : "Update Password"}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleSaveAccount}
                          disabled={savingAccount}
                          className="rounded-lg bg-teal-600 px-6 py-2 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {savingAccount ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deletingAccount}
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {deletingAccount ? "Deleting..." : "Delete Account"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "subscription" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl text-slate-900">Subscription & Billing</h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Billing details below come from your linked Stripe customer and saved invoice events when billing is configured.
                        </p>
                      </div>

                      <div className="rounded-lg border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-teal-600" />
                              <h3 className="text-lg text-slate-900">Pay-As-You-Go</h3>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">£10/month + £0.20 per trade analysed</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-sm ${liveSubscriptionStatus === "paused" ? "bg-amber-100 text-amber-700" : liveSubscriptionStatus === "active" || liveSubscriptionStatus === "trialing" ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                            {liveSubscriptionStatus === "paused"
                              ? "Paused"
                              : liveSubscriptionStatus === "active" || liveSubscriptionStatus === "trialing"
                                ? "Active"
                                : liveSubscriptionStatus === "not_started"
                                  ? "Not Started"
                                  : liveSubscriptionStatus}
                          </span>
                        </div>
                        {billingSummary?.currentPeriodEnd && (
                          <p className="mt-4 text-sm text-slate-700">
                            Current billing period ends {formatTimestamp(billingSummary.currentPeriodEnd)}.
                          </p>
                        )}
                        {billingSummary?.referralCode && (
                          <p className="mt-2 text-sm text-slate-700">
                            Referral code `{billingSummary.referralCode}` is active: {billingSummary.accountDiscountPercent}% off account billing and {billingSummary.mlRunDiscountPercent}% off ML runs.
                          </p>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm text-slate-500">Current Billing Method</div>
                          <div className="mt-2 text-slate-900">{billingLoading ? "Loading..." : formatBillingMethod()}</div>
                          <p className="mt-2 text-sm text-slate-600">
                            Payment methods are managed securely in Stripe. Your full card details are never stored in this app.
                          </p>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                          <div className="text-sm text-slate-500">Billing Actions</div>
                          <div className="mt-3 flex flex-wrap gap-3">
                            <button
                              onClick={handleUpdateBillingMethod}
                              disabled={openingBillingPortal || billingSummary?.stripeConfigured === false}
                              className="rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {openingBillingPortal ? "Opening..." : billingSummary?.currentBillingMethod ? "Update Billing Method" : "Add Billing Method"}
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            Use the secure Stripe billing portal to update the card or payment method used for platform access charges.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {(liveSubscriptionStatus === "active" || liveSubscriptionStatus === "trialing") && onPauseSubscription && (
                          <button
                            onClick={onPauseSubscription}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-700 transition-colors hover:bg-amber-100"
                          >
                            Pause Subscription
                          </button>
                        )}
                        {liveSubscriptionStatus === "paused" && onResumeSubscription && (
                          <button
                            onClick={onResumeSubscription}
                            className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-teal-700 transition-colors hover:bg-teal-100"
                          >
                            Resume Subscription
                          </button>
                        )}
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-red-600 transition-colors hover:bg-red-100"
                        >
                          Cancel Subscription
                        </button>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                        <h3 className="text-slate-900">Billing History</h3>
                        {!billingSummary?.recentInvoices?.length ? (
                          <p className="mt-2 text-sm text-slate-600">
                            No paid or failed subscription invoices have been recorded for this account yet.
                          </p>
                        ) : (
                          <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                              <thead className="text-slate-500">
                                <tr>
                                  <th className="pb-2 pr-4">Date</th>
                                  <th className="pb-2 pr-4">Status</th>
                                  <th className="pb-2 pr-4">Amount</th>
                                  <th className="pb-2 pr-4">Period</th>
                                </tr>
                              </thead>
                              <tbody className="text-slate-700">
                                {billingSummary.recentInvoices.map((invoice) => (
                                  <tr key={invoice.id} className="border-t border-slate-200">
                                    <td className="py-3 pr-4">{formatTimestamp(invoice.occurredAt)}</td>
                                    <td className="py-3 pr-4">{invoice.status || "Unknown"}</td>
                                    <td className="py-3 pr-4">{formatMoney(invoice.amountPaid ?? invoice.amount, invoice.currency)}</td>
                                    <td className="py-3 pr-4">
                                      {invoice.periodStart && invoice.periodEnd
                                        ? `${formatTimestamp(invoice.periodStart)} to ${formatTimestamp(invoice.periodEnd)}`
                                        : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "ea-code" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl text-slate-900">EA Connection</h2>
                        <p className="mt-1 text-sm text-slate-600">Use your live API key and MetaTrader account to connect the EA.</p>
                      </div>

                      <div className={`rounded-lg border p-4 ${eaHealthTone.panelClass}`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <Activity className="h-5 w-5 text-slate-700" />
                              <h3 className="text-slate-900">EA Health</h3>
                              <span className={`rounded-full px-3 py-1 text-xs ${eaHealthTone.badgeClass}`}>
                                {eaHealthTone.badge}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-700">{eaHealthTone.copy}</p>
                          </div>
                          <button
                            onClick={handleRefreshEaHealth}
                            disabled={refreshingEaHealth}
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshingEaHealth ? "animate-spin" : ""}`} />
                            {refreshingEaHealth ? "Refreshing..." : "Refresh Health"}
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="rounded-lg bg-white/80 p-3 ring-1 ring-slate-200">
                            <div className="text-xs text-slate-500">Last Seen</div>
                            <div className="mt-1 text-sm text-slate-900">{formatTimestamp(eaStatus?.eaLastSeenAt || null)}</div>
                          </div>
                          <div className="rounded-lg bg-white/80 p-3 ring-1 ring-slate-200">
                            <div className="text-xs text-slate-500">Last Heartbeat</div>
                            <div className="mt-1 text-sm text-slate-900">{formatTimestamp(eaStatus?.eaLastHeartbeatAt || null)}</div>
                          </div>
                          <div className="rounded-lg bg-white/80 p-3 ring-1 ring-slate-200">
                            <div className="text-xs text-slate-500">Last History Export</div>
                            <div className="mt-1 text-sm text-slate-900">{formatTimestamp(eaStatus?.eaLastExportAt || null)}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-lg bg-white/80 p-3 ring-1 ring-slate-200">
                            <div className="text-xs text-slate-500">Expected API Host</div>
                            <div className="mt-1 break-all text-sm text-slate-900">{eaDiagnostics?.expected.apiBaseUrl || "Unknown"}</div>
                          </div>
                          <div className="rounded-lg bg-white/80 p-3 ring-1 ring-slate-200">
                            <div className="text-xs text-slate-500">Online Window</div>
                            <div className="mt-1 text-sm text-slate-900">
                              {eaStatus?.onlineWindowMinutes ? `${eaStatus.onlineWindowMinutes} minutes` : "15 minutes"}
                            </div>
                          </div>
                        </div>

                        {eaDiagnostics?.hints?.length ? (
                          <div className="mt-4 rounded-lg bg-white/80 p-4 ring-1 ring-slate-200">
                            <div className="mb-2 text-sm text-slate-700">Connection Hints</div>
                            <ul className="space-y-2 text-sm text-slate-600">
                              {eaDiagnostics.hints.slice(0, 3).map((hint) => (
                                <li key={hint}>• {hint}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 text-sm text-slate-600">MetaTrader ID</div>
                        <div className="text-slate-900">{formData.mtUsername || "Not set yet"}</div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-2 text-sm text-slate-600">Broker</div>
                        <div className="text-slate-900">{formData.broker || "Not set yet"}</div>
                      </div>

                      <div className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <div className="text-sm text-slate-600">Current API key</div>
                            <div className="text-slate-900">
                              {currentApiKey
                                ? currentApiKey
                                : managedEaApiKey
                                  ? `MetaTrader EA key ending ${managedEaApiKey.last4}`
                                  : activeApiKeys[0]
                                    ? `Active key ending ${activeApiKeys[0].last4}`
                                  : "No API key generated yet"}
                            </div>
                          </div>
                          {currentApiKey && (
                            <button
                              onClick={() => handleCopy("ea-key", currentApiKey)}
                              className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white transition-colors hover:bg-teal-700"
                            >
                              {copiedValue === "ea-key" ? "Copied!" : "Copy"}
                            </button>
                          )}
                        </div>
                        {!activeApiKeys[0] && !currentApiKey && (
                          <button
                            onClick={handleCreateApiKey}
                            disabled={creatingApiKey}
                            className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {creatingApiKey ? "Generating..." : "Generate API Key"}
                          </button>
                        )}
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="mb-3">
                          <div className="text-sm text-slate-600">Linked EA download</div>
                          <div className="text-slate-900">
                            Generate an MT4 or MT5 file with your managed API key and broker account already wired in. The EA waits for a model-run request, then uploads fresh historical trades.
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleDownloadEa("MT4")}
                            disabled={downloadingEaPlatform !== null}
                            className="rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {downloadingEaPlatform === "MT4" ? "Generating MT4..." : "Download MT4 EA"}
                          </button>
                          <button
                            onClick={() => handleDownloadEa("MT5")}
                            disabled={downloadingEaPlatform !== null}
                            className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-teal-700 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {downloadingEaPlatform === "MT5" ? "Generating MT5..." : "Download MT5 EA"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "api-keys" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl text-slate-900">API Keys</h2>
                          <p className="mt-1 text-sm text-slate-600">These keys are loaded from the backend and can be copied or revoked.</p>
                        </div>
                        <button
                          onClick={handleCreateApiKey}
                          disabled={creatingApiKey}
                          className="rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {creatingApiKey ? "Creating..." : "Create API Key"}
                        </button>
                      </div>

                      {freshApiKey && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm text-emerald-700">New API key</div>
                              <div className="mt-1 break-all font-mono text-sm text-emerald-900">{freshApiKey}</div>
                            </div>
                            <button
                              onClick={() => handleCopy("fresh-key", freshApiKey)}
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
                            >
                              {copiedValue === "fresh-key" ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        {apiKeys.length === 0 ? (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                            No API keys yet.
                          </div>
                        ) : (
                          apiKeys.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
                              <div>
                                <div className="text-slate-900">{item.name}</div>
                                <div className="text-sm text-slate-600">
                                  Ending {item.last4} • {item.revokedAt ? "Revoked" : "Active"}
                                </div>
                              </div>
                              {!item.revokedAt && (
                                <button
                                  onClick={() => handleRevokeApiKey(item.id)}
                                  disabled={regeneratingApiKeyId === item.id}
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {regeneratingApiKeyId === item.id ? "Revoking..." : "Revoke"}
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Never share your API key publicly. Revoking a key immediately disconnects any EA using it.
                      </div>
                    </div>
                  )}

                  {activeTab === "referrals" && (
                    <div className="space-y-4">
                      <h2 className="text-xl text-slate-900">Referrals</h2>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                        <div className="flex items-start gap-3">
                          <Gift className="mt-0.5 h-5 w-5 text-teal-600" />
                          <div>
                            <p className="text-slate-900">Referral discounts are now account-linked.</p>
                            <p className="mt-2 text-sm text-slate-600">
                              {billingSummary?.referralCode
                                ? `Your account currently has referral code ${billingSummary.referralCode} applied.`
                                : "No active referral discount is currently linked to this account."}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-2 text-sm text-slate-600">Referral code</div>
                        <div className="flex items-center justify-between gap-3">
                          <code className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-900">{referralCode}</code>
                          <button
                            onClick={() => handleCopy("referral-code", referralCode)}
                            className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700"
                          >
                            {copiedValue === "referral-code" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h3 className="text-xl text-slate-900">Cancel Subscription</h3>
            <p className="mt-2 text-sm text-slate-600">
              This schedules cancellation at period end and stores your feedback for the admin panel.
            </p>
            <div className="mt-4 space-y-3">
              {[
                ["too-expensive", "Too expensive"],
                ["not-using", "Not using it enough"],
                ["technical-issues", "Technical issues or bugs"],
                ["missing-features", "Missing features I need"],
                ["other", "Other reason"],
              ].map(([value, label]) => (
                <label key={value} className={`flex items-center gap-3 rounded-lg border-2 p-3 ${cancelReason === value ? "border-teal-600 bg-teal-50" : "border-slate-200"}`}>
                  <input
                    type="radio"
                    checked={cancelReason === value}
                    onChange={() => setCancelReason(value)}
                  />
                  <span className="text-sm text-slate-900">{label}</span>
                </label>
              ))}
              <textarea
                rows={4}
                value={cancelFeedback}
                onChange={(e) => setCancelFeedback(e.target.value)}
                placeholder="Optional feedback"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => {
                  if (!cancelReason) {
                    setPageError("Please select a cancellation reason.");
                    return;
                  }
                  onCancelSubscription(cancelReason, cancelFeedback);
                  setShowCancelModal(false);
                  setCancelReason("");
                  setCancelFeedback("");
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
