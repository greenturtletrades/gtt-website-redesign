import { useState } from "react";
import { Plus, Edit2, Trash2, Search, Calendar, TrendingUp, TrendingDown, BookOpen, Save, X } from "lucide-react";
import { Activity } from "lucide-react";
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface JournalEntry {
  id: string;
  date: string;
  pair: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  entryTime: string;
  exitTime: string;
  duration: number; // in minutes
  exitType: "TP" | "SL" | "Manual";
  result: number | null;
  rMultiple: number;
  notes: string;
  emotions: string;
  lessonsLearned: string;
  marketConditions: string;
}

interface TraderJournalProps {
  entries?: JournalEntry[];
  pnlMeta?: {
    currency_pnl_available?: boolean;
    message?: string | null;
    source_column?: string | null;
  };
}

function toSafeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toSafeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function cleanImportedText(value: unknown): string {
  const text = toSafeString(value).trim();
  if (
    text === "Imported from analysed trade data." ||
    text === "Not captured in uploaded trade data." ||
    text === "Review this trade inside the analytics dashboard for pattern insights."
  ) {
    return "";
  }
  return text;
}

function normalizeJournalEntry(entry: Partial<JournalEntry>): JournalEntry {
  return {
    id: toSafeString(entry.id, Date.now().toString()),
    date: toSafeString(entry.date),
    pair: toSafeString(entry.pair, "Trade"),
    direction: entry.direction === "short" ? "short" : "long",
    entryPrice: toSafeNumber(entry.entryPrice),
    exitPrice: toSafeNumber(entry.exitPrice),
    stopLoss: toSafeNumber(entry.stopLoss),
    takeProfit: toSafeNumber(entry.takeProfit),
    entryTime: toSafeString(entry.entryTime),
    exitTime: toSafeString(entry.exitTime),
    duration: Math.max(0, Math.round(toSafeNumber(entry.duration))),
    exitType: entry.exitType === "TP" || entry.exitType === "SL" ? entry.exitType : "Manual",
    result:
      entry.result === null || entry.result === undefined
        ? null
        : toSafeNumber(entry.result),
    rMultiple: toSafeNumber(entry.rMultiple),
    notes: cleanImportedText(entry.notes),
    emotions: cleanImportedText(entry.emotions),
    lessonsLearned: cleanImportedText(entry.lessonsLearned),
    marketConditions: toSafeString(entry.marketConditions),
  };
}

function extractBaseAsset(pair: string): string | null {
  const symbol = toSafeString(pair).toUpperCase().trim();
  if (!symbol) return null;
  const fxLike = symbol.replace(/[^A-Z]/g, "");
  if (fxLike.length >= 6) {
    return fxLike.slice(0, 3);
  }
  return symbol;
}

export function TraderJournal({ entries: liveEntries = [], pnlMeta }: TraderJournalProps) {
  const numberFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [liveOverrides, setLiveOverrides] = useState<Record<string, JournalEntry>>({});
  const hasLiveEntries = liveEntries.length > 0;
  const hasCurrencyPnl =
    pnlMeta?.currency_pnl_available === true ||
    (!hasLiveEntries && entries.some((entry) => entry.result !== null));
  const activeEntries = hasLiveEntries
    ? liveEntries.map((entry) => normalizeJournalEntry(liveOverrides[entry.id] ?? entry))
    : entries;
  const formatPnl = (value: number | null) =>
    value === null ? "N/A" : `${value >= 0 ? "+" : "-"}${numberFormatter.format(Math.abs(value))}`;
  const getTradeOutcomeValue = (entry: JournalEntry) =>
    entry.result !== null && entry.result !== undefined ? entry.result : entry.rMultiple;
  const isWinningTrade = (entry: JournalEntry) => getTradeOutcomeValue(entry) > 0;
  const isLosingTrade = (entry: JournalEntry) => getTradeOutcomeValue(entry) < 0;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    pair: "",
    direction: "long" as "long" | "short",
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    takeProfit: "",
    entryTime: "",
    exitTime: "",
    duration: "",
    exitType: "TP" as "TP" | "SL" | "Manual",
    result: "",
    rMultiple: "",
    notes: "",
    emotions: "",
    lessonsLearned: "",
    marketConditions: ""
  });

  const handleSubmit = () => {
    if (!formData.pair || !formData.entryPrice || !formData.exitPrice) {
      alert("Please fill in all required fields");
      return;
    }

    const newEntry: JournalEntry = normalizeJournalEntry({
      id: editingEntry ? editingEntry.id : Date.now().toString(),
      date: formData.date,
      pair: formData.pair,
      direction: formData.direction,
      entryPrice: parseFloat(formData.entryPrice),
      exitPrice: parseFloat(formData.exitPrice),
      stopLoss: parseFloat(formData.stopLoss),
      takeProfit: parseFloat(formData.takeProfit),
      entryTime: formData.entryTime,
      exitTime: formData.exitTime,
      duration: parseInt(formData.duration),
      exitType: formData.exitType,
      result: parseFloat(formData.result),
      rMultiple: parseFloat(formData.rMultiple),
      notes: formData.notes,
      emotions: formData.emotions,
      lessonsLearned: formData.lessonsLearned,
      marketConditions: formData.marketConditions
    });

    if (editingEntry && hasLiveEntries) {
      setLiveOverrides((prev) => ({ ...prev, [editingEntry.id]: newEntry }));
    } else if (editingEntry) {
      setEntries(entries.map(e => e.id === editingEntry.id ? newEntry : e));
    } else {
      setEntries([newEntry, ...entries]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      pair: "",
      direction: "long",
      entryPrice: "",
      exitPrice: "",
      stopLoss: "",
      takeProfit: "",
      entryTime: "",
      exitTime: "",
      duration: "",
      exitType: "TP",
      result: "",
      rMultiple: "",
      notes: "",
      emotions: "",
      lessonsLearned: "",
      marketConditions: ""
    });
    setShowAddModal(false);
    setEditingEntry(null);
  };

  const handleEdit = (entry: JournalEntry) => {
    const normalizedEntry = normalizeJournalEntry(entry);
    setEditingEntry(normalizedEntry);
    setFormData({
      date: normalizedEntry.date,
      pair: normalizedEntry.pair,
      direction: normalizedEntry.direction,
      entryPrice: normalizedEntry.entryPrice.toString(),
      exitPrice: normalizedEntry.exitPrice.toString(),
      stopLoss: normalizedEntry.stopLoss.toString(),
      takeProfit: normalizedEntry.takeProfit.toString(),
      entryTime: normalizedEntry.entryTime,
      exitTime: normalizedEntry.exitTime,
      duration: normalizedEntry.duration.toString(),
      exitType: normalizedEntry.exitType,
      result: normalizedEntry.result === null ? "" : normalizedEntry.result.toString(),
      rMultiple: normalizedEntry.rMultiple.toString(),
      notes: normalizedEntry.notes,
      emotions: normalizedEntry.emotions,
      lessonsLearned: normalizedEntry.lessonsLearned,
      marketConditions: normalizedEntry.marketConditions
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const filteredEntries = activeEntries.filter(entry =>
    entry.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.lessonsLearned.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTrades = activeEntries.length;
  const winningTrades = activeEntries.filter((entry) => isWinningTrade(entry)).length;
  const losingTrades = activeEntries.filter((entry) => isLosingTrade(entry)).length;
  const totalPnL = hasCurrencyPnl
    ? activeEntries.reduce((sum, e) => sum + (e.result ?? 0), 0)
    : null;
  const avgR = activeEntries.length > 0 ? activeEntries.reduce((sum, e) => sum + e.rMultiple, 0) / activeEntries.length : 0;

  // Calculate monthly PnL
  const monthlyPnL = activeEntries.reduce((acc, entry) => {
    const monthKey = entry.date.substring(0, 7); // YYYY-MM format
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        pnl: 0,
        trades: 0,
        winners: 0,
        losers: 0,
        avgR: 0,
        totalR: 0
      };
    }
    acc[monthKey].pnl += entry.result ?? 0;
    acc[monthKey].trades += 1;
    acc[monthKey].totalR += entry.rMultiple;
    if (isWinningTrade(entry)) acc[monthKey].winners += 1;
    if (isLosingTrade(entry)) acc[monthKey].losers += 1;
    return acc;
  }, {} as Record<string, { month: string; pnl: number; trades: number; winners: number; losers: number; avgR: number; totalR: number }>);

  // Convert to array and calculate avgR
  const monthlyData = Object.values(monthlyPnL)
    .map(m => ({
      ...m,
      avgR: m.trades > 0 ? m.totalR / m.trades : 0,
      winRate: m.trades > 0 ? (m.winners / m.trades) * 100 : 0
    }))
    .sort((a, b) => b.month.localeCompare(a.month)); // Sort by most recent first
  const recentEntries = filteredEntries
    .slice()
    .sort((a, b) => {
      const aTime = new Date(`${a.date}T${a.entryTime || "00:00"}`).getTime();
      const bTime = new Date(`${b.date}T${b.entryTime || "00:00"}`).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);
  const instrumentCounts = activeEntries.reduce((acc, entry) => {
    acc[entry.pair] = (acc[entry.pair] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topInstruments = Object.entries(instrumentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pair, count]) => ({ pair, count }));
  const assetBreakdown = topInstruments.map(({ pair, count }) => ({
    name: pair,
    value: count,
  }));
  const totalAssetTrades = assetBreakdown.reduce((sum, item) => sum + item.value, 0);
  const baseAssetCounts = activeEntries.reduce((acc, entry) => {
    const baseAsset = extractBaseAsset(entry.pair);
    if (!baseAsset) return acc;
    acc[baseAsset] = (acc[baseAsset] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const baseAssetBreakdown = Object.entries(baseAssetCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));
  const averageDuration =
    activeEntries.length > 0
      ? Math.round(activeEntries.reduce((sum, entry) => sum + entry.duration, 0) / activeEntries.length)
      : 0;
  const longestHeldTrade = activeEntries.reduce<JournalEntry | null>((longest, entry) => {
    if (!longest || entry.duration > longest.duration) return entry;
    return longest;
  }, null);
  const pieColors = ["#0f766e", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#64748b"];

  return (
    <>
      {/* Header Section */}
      <div className="w-full bg-white py-8 px-4 sm:px-6 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-slate-900 mb-2 text-2xl sm:text-3xl">Trading Journal</h2>
              <p className="text-slate-600 text-base">
                {hasLiveEntries
                  ? "Journal rows are generated from your latest processed trade analysis."
                  : "No imported trades yet. Run the analytics model or add your own journal notes to start building your record."}
              </p>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <div>
                  <div className="text-xs text-teal-700">{hasLiveEntries ? "Analysis Sync Active" : "Waiting For Trade Data"}</div>
                  <div className="text-xs text-slate-600">
                    {hasLiveEntries ? "Showing trades from the latest Python analysis run" : "This journal will populate after a completed analysis import"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-teal-200 rounded-lg p-4 shadow-sm">
              <div className="text-slate-600 text-sm mb-1">Total Trades</div>
              <div className="text-teal-600 text-2xl">{totalTrades}</div>
            </div>
            <div className="bg-white border border-teal-200 rounded-lg p-4 shadow-sm">
              <div className="text-slate-600 text-sm mb-1">Winners</div>
              <div className="text-emerald-600 text-2xl">{winningTrades}</div>
            </div>
            <div className="bg-white border border-teal-200 rounded-lg p-4 shadow-sm">
              <div className="text-slate-600 text-sm mb-1">Losers</div>
              <div className="text-red-600 text-2xl">{losingTrades}</div>
            </div>
            <div className="bg-white border border-teal-200 rounded-lg p-4 shadow-sm">
              <div className="text-slate-600 text-sm mb-1">Profit / Loss</div>
              <div className={`text-2xl ${
                totalPnL === null ? "text-slate-500" : totalPnL >= 0 ? "text-teal-600" : "text-red-600"
              }`}>
                {formatPnl(totalPnL)}
              </div>
            </div>
            <div className="bg-white border border-teal-200 rounded-lg p-4 shadow-sm">
              <div className="text-slate-600 text-sm mb-1">Avg R</div>
              <div className={`text-2xl ${avgR >= 0 ? "text-teal-600" : "text-red-600"}`}>
                {avgR.toFixed(2)}
              </div>
            </div>
          </div>

          {!hasCurrencyPnl && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {pnlMeta?.message || "No position sizing found, so currency profit/loss cannot be calculated for this journal."}
            </div>
          )}

          {recentEntries.length > 0 && (
            <div className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                  <h3 className="text-slate-900 mb-4 text-xl flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                    Recent Trades
                  </h3>
                  <div className="space-y-3">
                    {recentEntries.map((entry) => (
                      <button
                        key={`recent-${entry.id}`}
                        onClick={() => handleEdit(entry)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-4 shadow-sm text-left hover:border-teal-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isWinningTrade(entry) ? "bg-teal-100" : isLosingTrade(entry) ? "bg-red-100" : "bg-slate-100"
                            }`}>
                              {isWinningTrade(entry) ? (
                                <TrendingUp className="w-5 h-5 text-teal-600" />
                              ) : isLosingTrade(entry) ? (
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              ) : (
                                <Activity className="w-5 h-5 text-slate-500" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-900">{entry.pair}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  entry.direction === "long"
                                    ? "bg-teal-100 text-teal-700"
                                    : "bg-red-100 text-red-700"
                                }`}>
                                  {entry.direction.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-slate-600 text-xs">
                                {new Date(entry.date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })} • {entry.entryTime} to {entry.exitTime}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm ${
                              entry.result === null ? "text-slate-500" : entry.result >= 0 ? "text-teal-600" : "text-red-600"
                            }`}>
                              Account P/L {formatPnl(entry.result)}
                            </div>
                            <div className={`text-xs ${entry.rMultiple >= 0 ? "text-teal-600" : "text-red-600"}`}>
                              {entry.rMultiple.toFixed(2)}R
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                          <div>
                            <div className="text-slate-500">Entry</div>
                            <div className="text-slate-800">{entry.entryPrice.toFixed(4)}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Exit</div>
                            <div className="text-slate-800">{entry.exitPrice.toFixed(4)}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">SL</div>
                            <div className="text-slate-800">{entry.stopLoss.toFixed(4)}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">TP</div>
                            <div className="text-slate-800">{entry.takeProfit.toFixed(4)}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Duration</div>
                            <div className="text-slate-800">{entry.duration}m</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-slate-900 mb-4 text-xl">Asset Summary</h3>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-slate-500 text-xs mb-1">Unique Assets</div>
                        <div className="text-slate-900 text-xl">{Object.keys(instrumentCounts).length}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-slate-500 text-xs mb-1">Avg Duration</div>
                        <div className="text-slate-900 text-xl">{averageDuration}m</div>
                      </div>
                    </div>

                    {assetBreakdown.length > 0 && (
                      <div className="mb-6">
                        <div className="text-slate-700 text-sm mb-3">Most Traded Assets</div>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={assetBreakdown}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={48}
                              outerRadius={80}
                              paddingAngle={2}
                            >
                              {assetBreakdown.map((entry, index) => (
                                <Cell key={`asset-slice-${entry.name}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number, name: string) => [`${value} trades`, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-3">
                          {assetBreakdown.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: pieColors[index % pieColors.length] }}
                                />
                                <span className="text-slate-700">{item.name}</span>
                              </div>
                              <span className="text-slate-500">
                                {item.value} trades
                                {totalAssetTrades > 0 ? ` • ${Math.round((item.value / totalAssetTrades) * 100)}%` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="text-slate-700 text-sm mb-3">Top Assets Traded</div>
                      <div className="space-y-2">
                        {topInstruments.map((item) => (
                          <div key={item.pair} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                            <span className="text-slate-800">{item.pair}</span>
                            <span className="text-slate-500">{item.count} trades</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {baseAssetBreakdown.length > 0 && (
                      <div className="mb-6">
                        <div className="text-slate-700 text-sm mb-3">Most Active Base Currencies / Assets</div>
                        <div className="space-y-2">
                          {baseAssetBreakdown.map((item) => (
                            <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                              <span className="text-slate-800">{item.name}</span>
                              <span className="text-slate-500">{item.value} trades</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {longestHeldTrade && (
                      <div>
                        <div className="text-slate-700 text-sm mb-3">Longest Held Trade</div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-900">{longestHeldTrade.pair}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              longestHeldTrade.direction === "long"
                                ? "bg-teal-100 text-teal-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {longestHeldTrade.direction.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-slate-600 text-sm">{longestHeldTrade.duration} minutes</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly PnL Table */}
          {monthlyData.length > 0 && (
            <div className="mt-8">
              <h3 className="text-slate-900 mb-4 text-xl flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                Month by Month Performance
              </h3>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Month</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Trades</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Winners</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Losers</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Win Rate</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">P&L</th>
                        <th className="text-left py-3 px-4 text-slate-700 text-sm">Avg R</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((monthData, idx) => {
                        const monthTrades = activeEntries.filter(e => e.date.substring(0, 7) === monthData.month);
                        const isExpanded = selectedMonth === monthData.month;
                        
                        // Determine predominant market conditions for this month
                        const conditions = monthTrades.map(t => t.marketConditions.toLowerCase());
                        const isTrending = conditions.filter(c => c.includes('trend')).length > conditions.length / 2;
                        const isVolatile = conditions.filter(c => c.includes('volatil') || c.includes('choppy')).length > conditions.length / 2;
                        const marketSummary = isTrending 
                          ? (monthData.pnl > 0 ? "Trending markets - favorable conditions" : "Trending markets - execution issues")
                          : isVolatile
                          ? "High volatility / choppy conditions"
                          : "Mixed market conditions";
                        
                        return (
                          <React.Fragment key={monthData.month}>
                            <tr 
                              onClick={() => setSelectedMonth(isExpanded ? null : monthData.month)}
                              className={`border-b border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer ${
                                monthData.pnl > 0 ? "bg-teal-50/30" : monthData.pnl < 0 ? "bg-red-50/30" : ""
                              } ${isExpanded ? "bg-slate-100" : ""}`}
                            >
                              <td className="py-3 px-4 text-sm">
                                <span className="text-slate-900">
                                  {new Date(monthData.month + "-01").toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long' 
                                  })}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-900">{monthData.trades}</td>
                              <td className="py-3 px-4 text-sm text-teal-600">{monthData.winners}</td>
                              <td className="py-3 px-4 text-sm text-red-600">{monthData.losers}</td>
                              <td className="py-3 px-4 text-sm">
                                <span className={monthData.winRate >= 50 ? "text-teal-600" : "text-slate-600"}>
                                  {monthData.winRate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <span className={`font-semibold ${
                                  !hasCurrencyPnl ? "text-slate-500" : monthData.pnl > 0 ? "text-teal-600" : monthData.pnl < 0 ? "text-red-600" : "text-slate-600"
                                }`}>
                                  {hasCurrencyPnl ? formatPnl(monthData.pnl) : "N/A"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <span className={`font-semibold ${
                                  monthData.avgR > 0 ? "text-teal-600" : monthData.avgR < 0 ? "text-red-600" : "text-slate-600"
                                }`}>
                                  {monthData.avgR.toFixed(2)}R
                                </span>
                              </td>
                            </tr>
                            
                            {/* Expanded Month Details */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="p-0">
                                  <div className="bg-slate-50 p-6 border-t border-slate-200">
                                    {/* Monthly Summary */}
                                    <div className="mb-6">
                                      <h4 className="text-slate-900 mb-3">
                                        {new Date(monthData.month + "-01").toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'long' 
                                        })} - Detailed Analysis
                                      </h4>
                                      
                                      {/* Market Conditions Summary */}
                                      <div className="bg-white rounded-lg p-4 mb-4 border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Activity className="w-4 h-4 text-teal-600" />
                                          <span className="text-slate-700">Market Conditions</span>
                                        </div>
                                        <p className="text-slate-600 text-sm">{marketSummary}</p>
                                      </div>

                                      {/* Detailed Stats Grid */}
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                                          <div className="text-slate-600 text-xs mb-1">Best Trade</div>
                                          <div className="text-teal-600">
                                            {Math.max(...monthTrades.map(t => t.rMultiple)).toFixed(2)}R
                                          </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                                          <div className="text-slate-600 text-xs mb-1">Worst Trade</div>
                                          <div className="text-red-600">
                                            {Math.min(...monthTrades.map(t => t.rMultiple)).toFixed(2)}R
                                          </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                                          <div className="text-slate-600 text-xs mb-1">Average Trade</div>
                                          <div className={
                                            (monthTrades.reduce((sum, t) => sum + t.rMultiple, 0) / monthTrades.length) >= 0
                                              ? "text-teal-600"
                                              : "text-red-600"
                                          }>
                                            {(monthTrades.reduce((sum, t) => sum + t.rMultiple, 0) / monthTrades.length).toFixed(2)}R
                                          </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                                          <div className="text-slate-600 text-xs mb-1">Win Streak</div>
                                          <div className="text-slate-900">
                                            {(() => {
                                              let maxStreak = 0, currentStreak = 0;
                                              monthTrades.forEach(t => {
                                                if (isWinningTrade(t)) {
                                                  currentStreak++;
                                                  maxStreak = Math.max(maxStreak, currentStreak);
                                                } else {
                                                  currentStreak = 0;
                                                }
                                              });
                                              return maxStreak;
                                            })()}
                                          </div>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                                          <div className="text-slate-600 text-xs mb-1">Loss Streak</div>
                                          <div className="text-slate-900">
                                            {(() => {
                                              let maxStreak = 0, currentStreak = 0;
                                              monthTrades.forEach(t => {
                                                if (isLosingTrade(t)) {
                                                  currentStreak++;
                                                  maxStreak = Math.max(maxStreak, currentStreak);
                                                } else {
                                                  currentStreak = 0;
                                                }
                                              });
                                              return maxStreak;
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Trades from This Month */}
                                    <div>
                                      <h5 className="text-slate-900 mb-3 text-sm flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-teal-600" />
                                        All Trades This Month ({monthTrades.length})
                                      </h5>
                                      <div className="space-y-2">
                                        {monthTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((trade) => (
                                          <div key={trade.id} className="bg-white rounded-lg p-4 border border-slate-200 hover:border-teal-300 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded flex items-center justify-center ${
                                                  isWinningTrade(trade) ? "bg-teal-100" : isLosingTrade(trade) ? "bg-red-100" : "bg-slate-100"
                                                }`}>
                                                  {isWinningTrade(trade) ? (
                                                    <TrendingUp className="w-4 h-4 text-teal-600" />
                                                  ) : isLosingTrade(trade) ? (
                                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                                  ) : (
                                                    <Activity className="w-4 h-4 text-slate-500" />
                                                  )}
                                                </div>
                                                <div>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-slate-900">{trade.pair}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                                      trade.direction === "long" 
                                                        ? "bg-teal-100 text-teal-700" 
                                                        : "bg-red-100 text-red-700"
                                                    }`}>
                                                      {trade.direction.toUpperCase()}
                                                    </span>
                                                  </div>
                                                  <div className="text-slate-600 text-xs">
                                                    {new Date(trade.date).toLocaleDateString('en-US', { 
                                                      month: 'short', 
                                                      day: 'numeric' 
                                                    })}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                  <div className={`text-sm ${
                                                    trade.result === null ? "text-slate-500" : trade.result >= 0 ? "text-teal-600" : "text-red-600"
                                                  }`}>
                                                    {formatPnl(trade.result)}
                                                  </div>
                                                  <div className={`text-xs ${
                                                    trade.rMultiple >= 0 ? "text-teal-600" : "text-red-600"
                                                  }`}>
                                                    {trade.rMultiple.toFixed(2)}R
                                                  </div>
                                                </div>
                                                {!hasLiveEntries && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleEdit(trade);
                                                    }}
                                                    className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                                  >
                                                    <Edit2 className="w-4 h-4" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                            {trade.notes && (
                                              <p className="text-slate-600 text-xs mt-2 pl-11">{trade.notes}</p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeEntries.length === 0 && (
            <div className="mt-8 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <BookOpen className="h-6 w-6 text-slate-600" />
              </div>
              <h3 className="text-lg text-slate-900">No journal trades yet</h3>
              <p className="mt-2 text-sm text-slate-600">
                Completed trade imports from your latest ML analysis will appear here. You can also add a manual journal entry whenever you want to capture notes before import.
              </p>
            </div>
          )}

          {/* Search */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search journal entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-slate-900 text-2xl">
                {editingEntry ? "Edit Journal Entry" : "New Journal Entry"}
              </h2>
              <button onClick={resetForm} className="text-slate-600 hover:text-slate-900">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {editingEntry && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-2">
                  <p className="text-teal-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <strong>Trade data is auto-imported from your latest analysis.</strong> You can add notes and adjust any field if needed.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Currency Pair *</label>
                  <input
                    type="text"
                    placeholder="e.g., EUR/USD"
                    value={formData.pair}
                    onChange={(e) => setFormData({...formData, pair: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Direction *</label>
                  <select
                    value={formData.direction}
                    onChange={(e) => setFormData({...formData, direction: e.target.value as "long" | "short"})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Market Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g., Trending bullish, high volatility"
                    value={formData.marketConditions}
                    onChange={(e) => setFormData({...formData, marketConditions: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Entry Price *</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g., 1.0850"
                    value={formData.entryPrice}
                    onChange={(e) => setFormData({...formData, entryPrice: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Exit Price *</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g., 1.0920"
                    value={formData.exitPrice}
                    onChange={(e) => setFormData({...formData, exitPrice: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">SL</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g., 1.0810"
                    value={formData.stopLoss}
                    onChange={(e) => setFormData({...formData, stopLoss: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">TP</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="e.g., 1.0920"
                    value={formData.takeProfit}
                    onChange={(e) => setFormData({...formData, takeProfit: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Entry Time</label>
                  <input
                    type="time"
                    value={formData.entryTime}
                    onChange={(e) => setFormData({...formData, entryTime: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Exit Time</label>
                  <input
                    type="time"
                    value={formData.exitTime}
                    onChange={(e) => setFormData({...formData, exitTime: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Duration (minutes)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g., 75"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Exit Type</label>
                  <select
                    value={formData.exitType}
                    onChange={(e) => setFormData({...formData, exitType: e.target.value as "TP" | "SL" | "Manual"})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="TP">Take Profit</option>
                    <option value="SL">Stop Loss</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Result ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 420.50"
                    value={formData.result}
                    onChange={(e) => setFormData({...formData, result: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">R-Multiple</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 2.1"
                    value={formData.rMultiple}
                    onChange={(e) => setFormData({...formData, rMultiple: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-2 text-sm">Trade Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe your trade setup, entry reasoning, and execution..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-2 text-sm">Emotions During Trade</label>
                <textarea
                  rows={2}
                  placeholder="How did you feel? Were you calm, anxious, overconfident?"
                  value={formData.emotions}
                  onChange={(e) => setFormData({...formData, emotions: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-2 text-sm">Lessons Learned</label>
                <textarea
                  rows={2}
                  placeholder="What did you learn from this trade? What would you do differently?"
                  value={formData.lessonsLearned}
                  onChange={(e) => setFormData({...formData, lessonsLearned: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingEntry ? "Update Entry" : "Save Entry"}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
