import { X, Brain, TrendingUp, Calendar, BarChart3, Activity, Target, Percent } from "lucide-react";
import { useState } from "react";

interface TraderDetailsModalProps {
  trader: {
    id: string;
    name: string;
    email: string;
    status: "active" | "inactive";
    plan: "payg" | "premium";
    joinDate: string;
    totalTrades: number;
    mlAnalyses: number;
    revenue: number;
  };
  onClose: () => void;
}

export function TraderDetailsModal({ trader, onClose }: TraderDetailsModalProps) {
  const [activeView, setActiveView] = useState<"ml" | "trading">("ml");

  // Mock ML usage data
  const mlData = {
    totalAnalyses: trader.mlAnalyses,
    lastAnalysis: "2 hours ago",
    avgProcessingTime: "1.3s",
    successRate: 96.2,
    analysisTypes: [
      { type: "Counterfactual Simulation", count: 45, percentage: 28.8 },
      { type: "Bayesian Optimisation", count: 38, percentage: 24.4 },
      { type: "Survival Analysis", count: 35, percentage: 22.4 },
      { type: "Clustering Analysis", count: 38, percentage: 24.4 }
    ],
    recentAnalyses: [
      { date: "2026-01-02 14:30", type: "Counterfactual", status: "Completed", duration: "1.2s" },
      { date: "2026-01-02 10:15", type: "Bayesian", status: "Completed", duration: "1.4s" },
      { date: "2026-01-01 16:45", type: "Survival", status: "Completed", duration: "1.1s" },
      { date: "2026-01-01 09:20", type: "Clustering", status: "Completed", duration: "1.5s" },
      { date: "2025-12-31 18:00", type: "Counterfactual", status: "Completed", duration: "1.3s" }
    ],
    monthlyUsage: [
      { month: "Dec 2025", analyses: 89 },
      { month: "Jan 2026", analyses: 67 }
    ]
  };

  // Mock trading performance data
  const tradingData = {
    totalTrades: trader.totalTrades,
    winRate: 68.5,
    avgReturn: 2.4,
    profitFactor: 1.85,
    sharpeRatio: 1.42,
    maxDrawdown: 12.3,
    avgWinSize: 3.2,
    avgLossSize: -1.8,
    bestTrade: 12.5,
    worstTrade: -5.2,
    avgTradeDuration: "2.5 hours",
    totalProfit: 5420.50,
    totalLoss: -2930.20,
    recentTrades: [
      { date: "2026-01-02", pair: "EUR/USD", type: "Long", result: "Win", return: 2.3, profit: 145.20 },
      { date: "2026-01-02", pair: "GBP/USD", type: "Short", result: "Loss", return: -1.5, profit: -95.50 },
      { date: "2026-01-01", pair: "USD/JPY", type: "Long", result: "Win", return: 3.1, profit: 210.30 },
      { date: "2026-01-01", pair: "EUR/GBP", type: "Long", result: "Win", return: 1.8, profit: 120.00 },
      { date: "2025-12-31", pair: "AUD/USD", type: "Short", result: "Loss", return: -2.2, profit: -140.00 }
    ],
    performance30d: { trades: 45, winRate: 71.1, avgReturn: 2.6 },
    performance90d: { trades: 132, winRate: 67.4, avgReturn: 2.3 },
    performanceAllTime: { trades: trader.totalTrades, winRate: 68.5, avgReturn: 2.4 }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl mb-1">{trader.name}</h2>
            <p className="text-slate-300 text-sm">{trader.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`px-3 py-1 text-xs rounded-full ${
                trader.status === "active" ? "bg-green-500/20 text-green-300" : "bg-slate-500/20 text-slate-300"
              }`}>
                {trader.status === "active" ? "Active" : "Inactive"}
              </span>
              <span className={`px-3 py-1 text-xs rounded-full ${
                trader.plan === "premium" ? "bg-teal-500/20 text-teal-300" : "bg-slate-500/20 text-slate-300"
              }`}>
                {trader.plan === "premium" ? "Premium" : "Pay-As-You-Go"}
              </span>
              <span className="text-slate-400 text-xs">Joined {trader.joinDate}</span>
            </div>
          </div>
        </div>

        {/* Two Button Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 p-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveView("ml")}
              className={`py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeView === "ml"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Brain className="w-5 h-5" />
              <span>ML Usage & Analysis</span>
            </button>
            <button
              onClick={() => setActiveView("trading")}
              className={`py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeView === "trading"
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Trading Performance</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ML USAGE & ANALYSIS VIEW */}
          {activeView === "ml" && (
            <div className="space-y-6">
              {/* ML Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Total Analyses</div>
                  <div className="text-2xl text-slate-900">{mlData.totalAnalyses}</div>
                  <div className="text-xs text-purple-600 mt-1">All-time</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Success Rate</div>
                  <div className="text-2xl text-slate-900">{mlData.successRate}%</div>
                  <div className="text-xs text-green-600 mt-1">High accuracy</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Avg. Processing</div>
                  <div className="text-2xl text-slate-900">{mlData.avgProcessingTime}</div>
                  <div className="text-xs text-slate-600 mt-1">Per analysis</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Last Analysis</div>
                  <div className="text-xl text-slate-900">{mlData.lastAnalysis}</div>
                  <div className="text-xs text-slate-600 mt-1">Most recent</div>
                </div>
              </div>

              {/* Analysis Type Breakdown */}
              <div className="bg-white border border-slate-200 rounded-lg">
                <div className="border-b border-slate-200 p-4">
                  <h3 className="text-slate-900">Analysis Type Breakdown</h3>
                </div>
                <div className="p-4 space-y-3">
                  {mlData.analysisTypes.map((type, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-700">{type.type}</span>
                        <span className="text-sm text-slate-900">{type.count} ({type.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all" 
                          style={{ width: `${type.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Analyses */}
              <div className="bg-white border border-slate-200 rounded-lg">
                <div className="border-b border-slate-200 p-4">
                  <h3 className="text-slate-900">Recent Analyses</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Date & Time</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Type</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Status</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mlData.recentAnalyses.map((analysis, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-3 px-4 text-sm text-slate-900">{analysis.date}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                              {analysis.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                              {analysis.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">{analysis.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly Usage */}
              <div className="bg-white border border-slate-200 rounded-lg">
                <div className="border-b border-slate-200 p-4">
                  <h3 className="text-slate-900">Monthly Usage Trend</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {mlData.monthlyUsage.map((month, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">{month.month}</span>
                        <span className="text-sm text-slate-900">{month.analyses} analyses</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRADING PERFORMANCE VIEW */}
          {activeView === "trading" && (
            <div className="space-y-6">
              {/* Performance Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Win Rate</div>
                  <div className="text-2xl text-slate-900">{tradingData.winRate}%</div>
                  <div className="text-xs text-teal-600 mt-1">Success ratio</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Avg Return</div>
                  <div className="text-2xl text-slate-900">{tradingData.avgReturn}%</div>
                  <div className="text-xs text-green-600 mt-1">Per trade</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Profit Factor</div>
                  <div className="text-2xl text-slate-900">{tradingData.profitFactor}</div>
                  <div className="text-xs text-blue-600 mt-1">Risk/reward</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Sharpe Ratio</div>
                  <div className="text-2xl text-slate-900">{tradingData.sharpeRatio}</div>
                  <div className="text-xs text-purple-600 mt-1">Risk-adjusted</div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                    <Target className="w-3 h-3" />
                    Max Drawdown
                  </div>
                  <div className="text-xl text-red-600">{tradingData.maxDrawdown}%</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                    <TrendingUp className="w-3 h-3" />
                    Avg Win Size
                  </div>
                  <div className="text-xl text-green-600">+{tradingData.avgWinSize}%</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                    <Activity className="w-3 h-3" />
                    Avg Loss Size
                  </div>
                  <div className="text-xl text-red-600">{tradingData.avgLossSize}%</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                    <BarChart3 className="w-3 h-3" />
                    Best Trade
                  </div>
                  <div className="text-xl text-green-600">+{tradingData.bestTrade}%</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                    <BarChart3 className="w-3 h-3" />
                    Worst Trade
                  </div>
                  <div className="text-xl text-red-600">{tradingData.worstTrade}%</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
                    <Calendar className="w-3 h-3" />
                    Avg Duration
                  </div>
                  <div className="text-xl text-slate-900">{tradingData.avgTradeDuration}</div>
                </div>
              </div>

              {/* Performance Over Time */}
              <div className="bg-white border border-slate-200 rounded-lg">
                <div className="border-b border-slate-200 p-4">
                  <h3 className="text-slate-900">Performance Over Time</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-slate-600 text-xs mb-2">Last 30 Days</div>
                      <div className="text-sm text-slate-900 mb-1">{tradingData.performance30d.trades} trades</div>
                      <div className="text-xs text-slate-600">
                        Win Rate: <span className="text-teal-600">{tradingData.performance30d.winRate}%</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Avg Return: <span className="text-green-600">{tradingData.performance30d.avgReturn}%</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-slate-600 text-xs mb-2">Last 90 Days</div>
                      <div className="text-sm text-slate-900 mb-1">{tradingData.performance90d.trades} trades</div>
                      <div className="text-xs text-slate-600">
                        Win Rate: <span className="text-teal-600">{tradingData.performance90d.winRate}%</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Avg Return: <span className="text-green-600">{tradingData.performance90d.avgReturn}%</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-slate-600 text-xs mb-2">All Time</div>
                      <div className="text-sm text-slate-900 mb-1">{tradingData.performanceAllTime.trades} trades</div>
                      <div className="text-xs text-slate-600">
                        Win Rate: <span className="text-teal-600">{tradingData.performanceAllTime.winRate}%</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        Avg Return: <span className="text-green-600">{tradingData.performanceAllTime.avgReturn}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Trades */}
              <div className="bg-white border border-slate-200 rounded-lg">
                <div className="border-b border-slate-200 p-4">
                  <h3 className="text-slate-900">Recent Trades</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Date</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Pair</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Type</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Result</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Return</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-xs uppercase tracking-wide">Profit/Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradingData.recentTrades.map((trade, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-3 px-4 text-sm text-slate-900">{trade.date}</td>
                          <td className="py-3 px-4 text-sm text-slate-900">{trade.pair}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              trade.type === "Long" 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-orange-100 text-orange-700"
                            }`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              trade.result === "Win" 
                                ? "bg-green-100 text-green-700" 
                                : "bg-red-100 text-red-700"
                            }`}>
                              {trade.result}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={trade.return > 0 ? "text-green-600" : "text-red-600"}>
                              {trade.return > 0 ? "+" : ""}{trade.return}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={trade.profit > 0 ? "text-green-600" : "text-red-600"}>
                              £{trade.profit.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* P&L Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Total Profit</div>
                  <div className="text-2xl text-green-600">£{tradingData.totalProfit.toFixed(2)}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Total Loss</div>
                  <div className="text-2xl text-red-600">£{tradingData.totalLoss.toFixed(2)}</div>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="text-slate-600 text-xs mb-1">Net P&L</div>
                  <div className="text-2xl text-teal-600">
                    £{(tradingData.totalProfit + tradingData.totalLoss).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
