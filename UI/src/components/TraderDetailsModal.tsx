import { X, Activity, User, KeyRound, Database, Clock, CreditCard, BarChart3 } from "lucide-react";
import { useState } from "react";
import type { AdminTrader } from "../api/admin";

interface TraderDetailsModalProps {
  trader: AdminTrader;
  onClose: () => void;
}

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatLabel(value: string | null) {
  if (!value) return "Not provided";
  return value.replaceAll("_", " ");
}

function formatMetric(value: number | null, digits = 2) {
  if (value === null || Number.isNaN(value)) return "Not available";
  return value.toFixed(digits);
}

export function TraderDetailsModal({ trader, onClose }: TraderDetailsModalProps) {
  const [showTradingStats, setShowTradingStats] = useState(false);
  const accountStatusTone =
    trader.accountStatus === "ACTIVE"
      ? "bg-green-100 text-green-700"
      : trader.accountStatus === "PENDING"
        ? "bg-amber-100 text-amber-700"
        : trader.accountStatus === "DISABLED"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-700";

  const tradingReadiness =
    trader.metrics.tradesAnalysed
      ? "Latest ML analysis metrics available"
      : trader.tradeEventCount > 0
        ? "Live trading data available, but no completed ML analysis saved yet"
        : trader.historyExportCount > 0
          ? "History imported, waiting for a completed ML analysis run"
        : "No trading data connected yet";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="relative border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 transition-colors hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-2xl">{trader.name}</h2>
          <p className="mt-1 text-sm text-slate-300">{trader.email}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-3 py-1 ${accountStatusTone}`}>
              Account: {formatLabel(trader.accountStatus)}
            </span>
            <span className="rounded-full bg-teal-500/20 px-3 py-1 text-teal-200">
              Plan: {trader.plan === "premium" ? "Premium" : "PAYG"}
            </span>
            <button
              onClick={() => setShowTradingStats((current) => !current)}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-teal-100 transition-colors hover:bg-white/20"
            >
              Trading Stats
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {showTradingStats && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
              <div className="mb-4 flex items-center gap-2 text-slate-900">
                <BarChart3 className="h-5 w-5 text-teal-700" />
                <h3>Trading Stats Overview</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-teal-100 bg-white p-4">
                  <div className="text-xs text-slate-500">Trades Analysed</div>
                  <div className="mt-1 text-2xl text-slate-900">
                    {trader.metrics.tradesAnalysed ?? trader.tradeEventCount}
                  </div>
                </div>
                <div className="rounded-lg border border-teal-100 bg-white p-4">
                  <div className="text-xs text-slate-500">Win Rate</div>
                  <div className="mt-1 text-2xl text-slate-900">
                    {trader.metrics.winRate !== null ? `${Math.round(trader.metrics.winRate * 100)}%` : "Not available"}
                  </div>
                </div>
                <div className="rounded-lg border border-teal-100 bg-white p-4">
                  <div className="text-xs text-slate-500">Avg R Multiple</div>
                  <div className="mt-1 text-2xl text-slate-900">{formatMetric(trader.metrics.avgRMultiple)}</div>
                </div>
                <div className="rounded-lg border border-teal-100 bg-white p-4">
                  <div className="text-xs text-slate-500">Sharpe Ratio</div>
                  <div className="mt-1 text-2xl text-slate-900">{formatMetric(trader.metrics.sharpeRatio)}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-teal-100 bg-white p-4">
                  <div className="text-xs text-slate-500">Total R</div>
                  <div className="mt-1 text-xl text-slate-900">{formatMetric(trader.metrics.totalR)}</div>
                </div>
                <div className="rounded-lg border border-teal-100 bg-white p-4">
                  <div className="text-xs text-slate-500">Max Drawdown (R)</div>
                  <div className="mt-1 text-xl text-slate-900">{formatMetric(trader.metrics.maxDrawdownR)}</div>
                </div>
                <div className="rounded-lg border border-teal-100 bg-white p-4">
                  <div className="text-xs text-slate-500">Latest Analysis</div>
                  <div className="mt-1 text-sm text-slate-900">{formatDate(trader.latestAnalysisAt)}</div>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-teal-100 bg-white p-4 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Status:</span> {tradingReadiness}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <User className="h-4 w-4" />
                Account Created
              </div>
              <div className="text-sm text-slate-900">{formatDate(trader.joinedAt)}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <Database className="h-4 w-4" />
                Broker Accounts
              </div>
              <div className="text-2xl text-slate-900">{trader.brokerAccountsCount}</div>
              <div className="text-xs text-slate-500">{trader.activeBrokerAccountsCount} active</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <KeyRound className="h-4 w-4" />
                API Keys
              </div>
              <div className="text-2xl text-slate-900">{trader.apiKeysCount}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-4 w-4" />
                Last EA Sync
              </div>
              <div className="text-sm text-slate-900">{formatDate(trader.lastEaSyncAt)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="text-slate-900">Account Profile</h3>
              </div>
              <div className="space-y-3 p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Country</span>
                  <span className="text-right text-slate-900">{trader.country || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Platform</span>
                  <span className="text-right text-slate-900">{formatLabel(trader.platform)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Experience</span>
                  <span className="text-right text-slate-900">{formatLabel(trader.experienceLevel)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Account status</span>
                  <span className="text-right text-slate-900">{formatLabel(trader.accountStatus)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="text-slate-900">Platform Activity</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                    <Activity className="h-4 w-4" />
                    Stored Trades
                  </div>
                  <div className="text-2xl text-slate-900">{trader.tradeEventCount}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                    <Activity className="h-4 w-4" />
                    History Exports
                  </div>
                  <div className="text-2xl text-slate-900">{trader.historyExportCount}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                    <CreditCard className="h-4 w-4" />
                    Billing
                  </div>
                  <div className="text-sm text-slate-900">
                    {trader.plan === "premium" ? "Stripe subscription active" : "No premium subscription"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
