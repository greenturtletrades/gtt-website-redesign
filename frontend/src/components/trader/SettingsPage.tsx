import { useEffect, useState } from "react";
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
  X,
  Calculator,
} from "lucide-react";
import {
  createBillingPortalSession,
  changeTraderPassword,
  createApiKey,
  createBrokerAccount,
  deleteMyAccount,
  downloadEaFile,
  fetchAccountState,
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
} from "../../api/settings";
import { createCheckoutSession } from "../../api/subscription";
import { ApiError, clearStoredToken } from "../../api/client";

interface SettingsPageProps {
  userName: string;
  userEmail: string;
  currentPlan: "payg";
  subscriptionStatus?: "active" | "paused" | "cancelling" | "not_started" | "trialing";
  onPauseSubscription?: () => void;
  onResumeSubscription?: () => void;
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
  const [ownReferralCode, setOwnReferralCode] = useState<string | null>(null);
  const [ownReferralDiscountPercent, setOwnReferralDiscountPercent] = useState(0);
  const [ownReferralDurationDays, setOwnReferralDurationDays] = useState(0);
  const [billingLoading, setBillingLoading] = useState(true);
  const [openingBillingPortal, setOpeningBillingPortal] = useState(false);
  const [startingUpgradeCheckout, setStartingUpgradeCheckout] = useState(false);
  const [refreshingEaHealth, setRefreshingEaHealth] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteFeedback, setDeleteFeedback] = useState("");

  const deleteReasonsRequiringExplanation = new Set([
    "technical-issues",
    "missing-features",
    "other",
  ]);

  const primaryBrokerAccount = brokerAccounts[0] || null;
  const activeApiKeys = apiKeys.filter((item) => !item.revokedAt);
  const managedEaApiKey = activeApiKeys.find((item) => item.name === "MetaTrader EA") || null;
  const currentApiKey = freshApiKey || null;
  const upgradeFeatures = [
    "£10/month base subscription",
    "£0.20 per trade analysed",
    "Access to Turtle Analytics",
    "Trade Journal",
    "Full counterfactual analysis",
    "MFE/MAE analysis",
    "Market regime clustering",
    "Trailing stop optimisation",
    "Email support",
  ];

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [accountState, brokerResponse, apiKeyResponse, eaStatusResponse, eaDiagnosticsResponse] = await Promise.all([
          fetchAccountState(),
          fetchBrokerAccounts(),
          fetchApiKeys(),
          fetchEaStatus(),
          fetchEaDiagnostics(),
        ]);

        if (cancelled) return;

        const liveName = getFullName(accountState.account.profile?.firstName, accountState.account.profile?.lastName);
        const firstBroker = brokerResponse.brokerAccounts[0] || null;

        setFormData({
          fullName: liveName || userName,
          email: accountState.account.email || userEmail,
          mtUsername: firstBroker?.accountNumber || "",
          broker: firstBroker?.brokerName || "",
        });
        setBrokerAccounts(brokerResponse.brokerAccounts);
        setApiKeys(apiKeyResponse.apiKeys);
        setEaStatus(eaStatusResponse);
        setEaDiagnostics(eaDiagnosticsResponse);
        setBillingSummary(accountState.account.billing);
        setOwnReferralCode(accountState.account.ownReferralCode?.code || null);
        setOwnReferralDiscountPercent(accountState.account.ownReferralCode?.accountDiscountPercent || 0);
        setOwnReferralDurationDays(accountState.account.ownReferralCode?.durationDays || 0);
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
    { id: "ea-code", label: "MetaTrader Setup", icon: Code },
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

  const isFreePlan =
    !billingSummary?.billingExempt &&
    !billingSummary?.platformComped &&
    liveSubscriptionStatus === "not_started";

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

  const handleUpgradeSubscription = async () => {
    setStartingUpgradeCheckout(true);
    setPageError(null);
    try {
      const response = await createCheckoutSession(billingSummary?.referralCode || undefined);
      if (response.bypass) {
        window.location.reload();
        return;
      }
      if (response.url) {
        window.location.assign(response.url);
        return;
      }
      throw new Error("Checkout session did not return a URL.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to start the upgrade checkout.");
      setStartingUpgradeCheckout(false);
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

  const handleDeleteAccount = async (reason: string, feedback: string, confirmOutstandingMlCharge = false) => {
    setDeletingAccount(true);
    setPageError(null);
    try {
      await deleteMyAccount({
        reason,
        feedback,
        plan: currentPlan,
        confirmOutstandingMlCharge,
      });
      clearStoredToken();
      window.location.replace("/");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const payload =
          error.payload && typeof error.payload === "object"
            ? (error.payload as { requiresFinalBillingConfirmation?: boolean; outstandingMlChargeTotal?: number })
            : null;
        if (payload?.requiresFinalBillingConfirmation) {
          const amount = typeof payload.outstandingMlChargeTotal === "number" ? payload.outstandingMlChargeTotal : 0;
          const confirmed = window.confirm(
            `Deleting your account will stop future platform billing. Stripe will first charge £${amount.toFixed(2)} for unpaid ML usage before the account is fully closed. Do you want to continue?`,
          );
          if (confirmed) {
            await handleDeleteAccount(reason, feedback, true);
            return;
          }
          return;
        }
      }
      setPageError(error instanceof Error ? error.message : "Unable to delete account.");
    } finally {
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
                          onClick={() => setShowDeleteModal(true)}
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
                              <h3 className="text-lg text-slate-900">
                                {isFreePlan ? "Free, Pay-As-You-Go" : "Pay-As-You-Go"}
                              </h3>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                              {billingSummary?.billingExempt
                                ? "Internal company account with billing exemption"
                                : billingSummary?.platformComped
                                  ? "Complimentary platform access is active on this account"
                                : isFreePlan
                                  ? "Free account active. Journal, settings, and account access are available without billing."
                                  : "£10/month + £0.20 per trade analysed"}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-sm ${liveSubscriptionStatus === "paused" ? "bg-amber-100 text-amber-700" : liveSubscriptionStatus === "active" || liveSubscriptionStatus === "trialing" ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                            {liveSubscriptionStatus === "paused"
                              ? "Paused"
                              : liveSubscriptionStatus === "active" || liveSubscriptionStatus === "trialing"
                                ? "Active"
                                : liveSubscriptionStatus === "internal"
                                  ? "Internal"
                                : liveSubscriptionStatus === "not_started"
                                  ? "Free Account"
                                  : liveSubscriptionStatus}
                          </span>
                        </div>
                        {billingSummary?.billingExempt && billingSummary?.billingExemptReason && (
                          <p className="mt-4 text-sm text-slate-700">{billingSummary.billingExemptReason}</p>
                        )}
                        {!billingSummary?.billingExempt && billingSummary?.platformComped && billingSummary?.platformCompedReason && (
                          <p className="mt-4 text-sm text-slate-700">{billingSummary.platformCompedReason}</p>
                        )}
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
                        {isFreePlan && (
                          <p className="mt-4 text-sm text-slate-700">
                            Upgrade from here whenever you want to unlock ML model runs and connect Stripe billing to this account.
                          </p>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {!isFreePlan && (
                          <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <div className="text-sm text-slate-500">Billing Information</div>
                            <div className="mt-2 text-slate-900">{billingLoading ? "Loading..." : formatBillingMethod()}</div>
                            <p className="mt-2 text-sm text-slate-600">
                              Payment methods are managed securely in Stripe. Your full card details are never stored in this app.
                            </p>
                          </div>
                        )}

                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                        <div className="text-sm text-slate-500">Billing Actions</div>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {isFreePlan && (
                            <button
                              onClick={() => setShowUpgradeModal(true)}
                              className="rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              Upgrade Subscription
                            </button>
                          )}
                          {!isFreePlan && (
                            <button
                              onClick={handleUpdateBillingMethod}
                              disabled={openingBillingPortal || billingSummary?.stripeConfigured === false}
                              className="rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {openingBillingPortal ? "Opening..." : "Update Billing Information"}
                            </button>
                          )}
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {isFreePlan
                              ? "Upgrade here when you want to unlock ML model runs."
                              : "Use the secure Stripe billing portal to update the card or payment method used for platform access charges."}
                          </p>
                        </div>
                      </div>

                      {!isFreePlan && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                            <div className="text-sm text-amber-700">ML Usage Charges Due</div>
                            <div className="mt-2 text-2xl text-slate-900">{billingLoading ? "Loading..." : formatMoney(billingSummary?.mlRunChargesDue ?? null, "GBP")}</div>
                            <p className="mt-2 text-sm text-slate-600">
                              Stripe-backed ML usage currently scheduled on your next subscription invoice.
                            </p>
                          </div>

                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                            <div className="text-sm text-emerald-700">Total Billing Paid</div>
                            <div className="mt-2 text-2xl text-slate-900">{billingLoading ? "Loading..." : formatMoney(billingSummary?.totalPaidBilling ?? null, "GBP")}</div>
                            <p className="mt-2 text-sm text-slate-600">
                              Stripe invoices actually collected and paid so far. Upcoming usage is not included until Stripe bills it.
                            </p>
                          </div>
                        </div>
                      )}

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
                      </div>

                      <div className={`rounded-lg border p-5 ${
                        liveSubscriptionStatus === "paused"
                          ? "border-amber-200 bg-amber-50"
                          : isFreePlan
                            ? "border-sky-200 bg-sky-50"
                          : "border-slate-200 bg-slate-50"
                      }`}>
                        <div className="text-sm text-slate-500">
                          {liveSubscriptionStatus === "paused"
                            ? "Paused Subscription Access"
                            : isFreePlan
                              ? "Free Account Access"
                              : "Active Subscription Access"}
                        </div>
                        <p className="mt-2 text-sm text-slate-700">
                          {liveSubscriptionStatus === "paused"
                            ? "Platform billing is paused. You can still sign in and access your account, journal, and settings, but new ML model runs are disabled until you resume the subscription."
                            : isFreePlan
                              ? "This account is currently on the free tier. You can sign in, use your journal, and manage settings now. Upgrade when you want ML model runs."
                              : "Your subscription currently allows both account access and new ML model runs. Pause it any time to stop monthly billing while keeping login access to your account."}
                        </p>
                      </div>

                      {!isFreePlan && (
                        <>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                            <h3 className="text-slate-900">ML Run Charges</h3>
                            {!billingSummary?.recentMlRunCharges?.length ? (
                              <p className="mt-2 text-sm text-slate-600">
                                No completed ML run charges have been recorded for this account yet.
                              </p>
                            ) : (
                              <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                  <thead className="text-slate-500">
                                    <tr>
                                      <th className="pb-2 pr-4">Date</th>
                                      <th className="pb-2 pr-4">Mode</th>
                                      <th className="pb-2 pr-4">Trades</th>
                                      <th className="pb-2 pr-4">Amount</th>
                                      <th className="pb-2 pr-4">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="text-slate-700">
                                    {billingSummary.recentMlRunCharges.map((run) => (
                                      <tr key={run.id} className="border-t border-slate-200">
                                        <td className="py-3 pr-4">{formatTimestamp(run.completedAt || run.createdAt)}</td>
                                        <td className="py-3 pr-4">{run.mode}</td>
                                        <td className="py-3 pr-4">{run.tradesAnalysed ?? "—"}</td>
                                        <td className="py-3 pr-4">{formatMoney(run.amount, "GBP")}</td>
                                        <td className="py-3 pr-4">
                                          {run.status === "paid"
                                            ? "Paid"
                                            : run.status === "pending"
                                              ? "Pending payment"
                                              : run.status === "reported"
                                                ? "Added to next monthly invoice"
                                              : run.status === "failed"
                                                ? "Payment failed"
                                                : run.status === "report_failed"
                                                  ? "Usage reporting failed"
                                                : run.status === "no_charge"
                                                  ? "No charge"
                                                  : "Due"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                            <h3 className="text-slate-900">Billing History</h3>
                            {!billingSummary?.recentInvoices?.length ? (
                              <p className="mt-2 text-sm text-slate-600">
                                No paid or failed Stripe billing records have been recorded for this account yet.
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
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === "ea-code" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl text-slate-900">MetaTrader Setup</h2>
                        <p className="mt-1 text-sm text-slate-600">Use your live API key and MetaTrader account to install, connect, and run the EA.</p>
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

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                        <div className="mb-3 text-slate-900">How To Set Up The EA In MetaTrader</div>
                        <div className="space-y-4 text-sm text-slate-700">
                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="text-slate-900">1. Install the EA file</div>
                            <p className="mt-1 text-slate-600">
                              Download the MT4 or MT5 EA above, then place the file in your platform&apos;s <span className="font-mono">Experts</span> folder and restart MetaTrader if needed.
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="text-slate-900">2. Compile it in MetaEditor if needed</div>
                            <p className="mt-1 text-slate-600">
                              If MetaTrader does not show the EA in Navigator straight away, open the file in <span className="font-mono">MetaEditor</span>, press <span className="font-mono">Compile</span>, and make sure there are no compile errors before going back to the platform.
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="text-slate-900">3. Allow web requests to the backend</div>
                            <p className="mt-1 text-slate-600">
                              In MetaTrader go to <span className="font-mono">Tools → Options → Expert Advisors</span>, tick <span className="font-mono">Allow WebRequest for listed URL</span>, and add the backend public domain shown in EA diagnostics.
                            </p>
                            <p className="mt-2 text-slate-600">
                              Use this exact backend URL:
                            </p>
                            <div className="mt-2 rounded bg-slate-100 px-3 py-2 font-mono text-xs text-slate-800 break-all">
                              {eaDiagnostics?.expected.apiBaseUrl || "Backend URL unavailable"}
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="text-slate-900">4. Attach the EA to a chart</div>
                            <p className="mt-1 text-slate-600">
                              Open any active chart in MetaTrader, drag the EA onto the chart, and enable <span className="font-mono">Algo Trading</span> / <span className="font-mono">AutoTrading</span> so the EA can respond to export requests.
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="text-slate-900">5. Keep the terminal running</div>
                            <p className="mt-1 text-slate-600">
                              The EA only sends trade history when the terminal is open, logged into the correct broker account, and the EA is still attached to the chart.
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="text-slate-900">6. Run analysis from this platform</div>
                            <p className="mt-1 text-slate-600">
                              When you press <span className="font-mono">Run Model Analysis</span>, the backend requests a fresh history export from MetaTrader. If no new trades appear, check the EA health panel above, confirm the WebRequest URL, and make sure the EA is attached to a live chart.
                            </p>
                          </div>
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
                            <p className="text-slate-900">Your referral code is live and redeemable.</p>
                            <p className="mt-2 text-sm text-slate-600">
                              {billingSummary?.referralCode
                                ? `Your account currently has referral code ${billingSummary.referralCode} applied.`
                                : "No active referral discount is currently linked to this account."}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              New traders who sign up with your code receive {ownReferralDiscountPercent}% off platform billing for {ownReferralDurationDays} days.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-2 text-sm text-slate-600">Referral code</div>
                        <div className="flex items-center justify-between gap-3">
                          <code className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-900">{ownReferralCode || "Loading..."}</code>
                          <button
                            onClick={() => ownReferralCode && handleCopy("referral-code", ownReferralCode)}
                            disabled={!ownReferralCode}
                            className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
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

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h3 className="text-xl text-slate-900">Delete Account</h3>
            <p className="mt-2 text-sm text-slate-600">
              This permanently disables your account, revokes your access, and stores your exit feedback for the admin panel.
            </p>
            {typeof billingSummary?.mlRunChargesAwaitingPayment === "number" && billingSummary.mlRunChargesAwaitingPayment > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                You have £{billingSummary.mlRunChargesAwaitingPayment.toFixed(2)} in ML usage awaiting payment. If you continue, future platform billing will stop and Stripe will attempt to charge that usage before the account is fully closed.
              </div>
            )}
            <div className="mt-4 space-y-3">
              {[
                ["finished-testing", "Finished testing the platform"],
                ["technical-issues", "Technical issues or bugs"],
                ["missing-features", "Missing features I need"],
                ["too-expensive", "Too expensive"],
                ["other", "Other reason"],
              ].map(([value, label]) => (
                <label key={value} className={`flex items-center gap-3 rounded-lg border-2 p-3 ${deleteReason === value ? "border-red-600 bg-red-50" : "border-slate-200"}`}>
                  <input
                    type="radio"
                    checked={deleteReason === value}
                    onChange={() => setDeleteReason(value)}
                  />
                  <span className="text-sm text-slate-900">{label}</span>
                </label>
              ))}
              <textarea
                rows={4}
                value={deleteFeedback}
                onChange={(e) => setDeleteFeedback(e.target.value)}
                placeholder={
                  deleteReasonsRequiringExplanation.has(deleteReason)
                    ? "Please explain so we can improve this"
                    : "Optional feedback"
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason("");
                  setDeleteFeedback("");
                }}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
              >
                Keep Account
              </button>
              <button
                onClick={() => {
                  if (!deleteReason) {
                    setPageError("Please select an account deletion reason.");
                    return;
                  }
                  if (
                    deleteReasonsRequiringExplanation.has(deleteReason) &&
                    !deleteFeedback.trim()
                  ) {
                    setPageError("Please add a short explanation for this account deletion reason.");
                    return;
                  }
                  setShowDeleteModal(false);
                  handleDeleteAccount(deleteReason, deleteFeedback);
                  setDeleteReason("");
                  setDeleteFeedback("");
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-10">
              <p className="text-sm uppercase tracking-[0.2em] text-teal-600">Upgrade Plan</p>
              <h3 className="mt-2 text-2xl text-slate-900">What You Get Access To</h3>
              <p className="mt-2 text-sm text-slate-600">
                Subscribe to unlock comprehensive trading analytics from inside your account settings.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl text-slate-900">Pay-As-You-Go</h4>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-semibold text-slate-900">£10</span>
                    <span className="pb-1 text-sm text-slate-600">/month</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">+ £0.20 per trade</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {upgradeFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 rounded-lg bg-white/80 px-3 py-3 ring-1 ring-teal-100">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="rounded-lg border border-slate-300 px-5 py-3 text-slate-700 transition-colors hover:bg-slate-50"
              >
                Not Now
              </button>
              <button
                onClick={handleUpgradeSubscription}
                disabled={startingUpgradeCheckout}
                className="rounded-lg bg-teal-600 px-6 py-3 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {startingUpgradeCheckout ? "Starting Checkout..." : "Continue to Upgrade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
