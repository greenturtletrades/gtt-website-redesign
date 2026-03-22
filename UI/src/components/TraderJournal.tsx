import { useState } from "react";
import { Plus, Edit2, Trash2, Search, Calendar, TrendingUp, TrendingDown, BookOpen, Save, X } from "lucide-react";
import { Activity } from "lucide-react";
import React from "react";

interface JournalEntry {
  id: string;
  date: string;
  pair: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  entryTime: string;
  exitTime: string;
  duration: number; // in minutes
  exitType: "TP" | "SL" | "Manual";
  result: number;
  rMultiple: number;
  notes: string;
  emotions: string;
  lessonsLearned: string;
  marketConditions: string;
}

export function TraderJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: "1",
      date: "2024-12-01",
      pair: "EUR/USD",
      direction: "long",
      entryPrice: 1.0850,
      exitPrice: 1.0920,
      entryTime: "14:30",
      exitTime: "15:45",
      duration: 75,
      exitType: "TP",
      result: 420,
      rMultiple: 2.1,
      notes: "Clean breakout above daily resistance. Entered on retest with confluence from 4H trend.",
      emotions: "Confident and patient. Waited for my setup.",
      lessonsLearned: "Trailing stop worked perfectly. Captured 70% of the move.",
      marketConditions: "Trending bullish, low volatility"
    },
    {
      id: "2",
      date: "2024-11-30",
      pair: "GBP/JPY",
      direction: "short",
      entryPrice: 192.45,
      exitPrice: 192.80,
      entryTime: "10:15",
      exitTime: "10:30",
      duration: 15,
      exitType: "SL",
      result: -180,
      rMultiple: -1.0,
      notes: "Entered too early on what looked like resistance. Market pushed higher before reversing.",
      emotions: "Frustrated but disciplined. Took the stop loss without hesitation.",
      lessonsLearned: "Need to wait for price action confirmation before entering counter-trend. Structure wasn't clear enough.",
      marketConditions: "Choppy range-bound"
    },
    {
      id: "3",
      date: "2024-11-29",
      pair: "USD/JPY",
      direction: "long",
      entryPrice: 149.20,
      exitPrice: 149.95,
      entryTime: "09:00",
      exitTime: "09:45",
      duration: 45,
      exitType: "TP",
      result: 625,
      rMultiple: 2.5,
      notes: "Perfect setup at daily support with bullish divergence on RSI. High probability trade.",
      emotions: "Calm and focused. Everything lined up.",
      lessonsLearned: "Patience paid off. Waited 3 days for this setup to develop.",
      marketConditions: "Trending bullish, NFP week"
    }
  ]);

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

    const newEntry: JournalEntry = {
      id: editingEntry ? editingEntry.id : Date.now().toString(),
      date: formData.date,
      pair: formData.pair,
      direction: formData.direction,
      entryPrice: parseFloat(formData.entryPrice),
      exitPrice: parseFloat(formData.exitPrice),
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
    };

    if (editingEntry) {
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
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      pair: entry.pair,
      direction: entry.direction,
      entryPrice: entry.entryPrice.toString(),
      exitPrice: entry.exitPrice.toString(),
      entryTime: entry.entryTime,
      exitTime: entry.exitTime,
      duration: entry.duration.toString(),
      exitType: entry.exitType,
      result: entry.result.toString(),
      rMultiple: entry.rMultiple.toString(),
      notes: entry.notes,
      emotions: entry.emotions,
      lessonsLearned: entry.lessonsLearned,
      marketConditions: entry.marketConditions
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.lessonsLearned.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTrades = entries.length;
  const winningTrades = entries.filter(e => e.result > 0).length;
  const losingTrades = entries.filter(e => e.result < 0).length;
  const totalPnL = entries.reduce((sum, e) => sum + e.result, 0);
  const avgR = entries.length > 0 ? entries.reduce((sum, e) => sum + e.rMultiple, 0) / entries.length : 0;

  // Calculate monthly PnL
  const monthlyPnL = entries.reduce((acc, entry) => {
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
    acc[monthKey].pnl += entry.result;
    acc[monthKey].trades += 1;
    acc[monthKey].totalR += entry.rMultiple;
    if (entry.result > 0) acc[monthKey].winners += 1;
    if (entry.result < 0) acc[monthKey].losers += 1;
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

  return (
    <>
      {/* Header Section */}
      <div className="w-full bg-white py-8 px-4 sm:px-6 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-slate-900 mb-2 text-2xl sm:text-3xl">Trading Journal</h2>
              <p className="text-slate-600 text-base">Trades are automatically imported from MetaTrader when closed. Add your notes and reflections.</p>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <div>
                  <div className="text-xs text-teal-700">Live Sync Active</div>
                  <div className="text-xs text-slate-600">Auto-importing trades from MT4/MT5</div>
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
              <div className="text-slate-600 text-sm mb-1">Total P&L</div>
              <div className={`text-2xl ${totalPnL >= 0 ? "text-teal-600" : "text-red-600"}`}>
                ${totalPnL.toFixed(0)}
              </div>
            </div>
            <div className="bg-white border border-teal-200 rounded-lg p-4 shadow-sm">
              <div className="text-slate-600 text-sm mb-1">Avg R</div>
              <div className={`text-2xl ${avgR >= 0 ? "text-teal-600" : "text-red-600"}`}>
                {avgR.toFixed(2)}
              </div>
            </div>
          </div>

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
                        const monthTrades = entries.filter(e => e.date.substring(0, 7) === monthData.month);
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
                                  monthData.pnl > 0 ? "text-teal-600" : monthData.pnl < 0 ? "text-red-600" : "text-slate-600"
                                }`}>
                                  ${monthData.pnl.toFixed(2)}
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
                                                if (t.result > 0) {
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
                                                if (t.result < 0) {
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
                                                  trade.result > 0 ? "bg-teal-100" : "bg-red-100"
                                                }`}>
                                                  {trade.result > 0 ? (
                                                    <TrendingUp className="w-4 h-4 text-teal-600" />
                                                  ) : (
                                                    <TrendingDown className="w-4 h-4 text-red-600" />
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
                                                    trade.result >= 0 ? "text-teal-600" : "text-red-600"
                                                  }`}>
                                                    ${trade.result.toFixed(2)}
                                                  </div>
                                                  <div className={`text-xs ${
                                                    trade.rMultiple >= 0 ? "text-teal-600" : "text-red-600"
                                                  }`}>
                                                    {trade.rMultiple.toFixed(2)}R
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(trade);
                                                  }}
                                                  className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                                >
                                                  <Edit2 className="w-4 h-4" />
                                                </button>
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

      {/* Main Content */}
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h3 className="text-slate-900 mb-6 text-xl flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Recent Trades
          </h3>
        <div className="space-y-6">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    entry.result > 0 ? "bg-teal-100" : "bg-red-100"
                  }`}>
                    {entry.result > 0 ? (
                      <TrendingUp className={`w-6 h-6 text-teal-600`} />
                    ) : (
                      <TrendingDown className={`w-6 h-6 text-red-600`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-slate-900 text-xl">{entry.pair}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        entry.direction === "long" 
                          ? "bg-teal-100 text-teal-700 border border-teal-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}>
                        {entry.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 text-sm mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-200">
                <div>
                  <div className="text-slate-600 text-sm mb-1">Entry Price</div>
                  <div className="text-slate-900">{entry.entryPrice.toFixed(4)}</div>
                  <div className="text-slate-500 text-xs mt-1">{entry.entryTime}</div>
                </div>
                <div>
                  <div className="text-slate-600 text-sm mb-1">Exit Price</div>
                  <div className="text-slate-900">{entry.exitPrice.toFixed(4)}</div>
                  <div className="text-slate-500 text-xs mt-1">{entry.exitTime}</div>
                </div>
                <div>
                  <div className="text-slate-600 text-sm mb-1">Result</div>
                  <div className={entry.result >= 0 ? "text-teal-600" : "text-red-600"}>
                    ${entry.result.toFixed(2)}
                  </div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${
                    entry.exitType === "TP" ? "bg-teal-100 text-teal-700" :
                    entry.exitType === "SL" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                    {entry.exitType === "TP" ? "Take Profit" : entry.exitType === "SL" ? "Stop Loss" : "Manual"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 text-sm mb-1">R-Multiple</div>
                  <div className={entry.rMultiple >= 0 ? "text-teal-600" : "text-red-600"}>
                    {entry.rMultiple.toFixed(2)}R
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    {Math.floor(entry.duration / 60)}h {entry.duration % 60}m
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-slate-700 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Trade Notes
                  </div>
                  <p className="text-slate-600 text-sm">{entry.notes}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-slate-700 mb-2 text-sm">Emotions</div>
                    <p className="text-slate-600 text-sm">{entry.emotions}</p>
                  </div>
                  <div>
                    <div className="text-slate-700 mb-2 text-sm">Market Conditions</div>
                    <p className="text-slate-600 text-sm">{entry.marketConditions}</p>
                  </div>
                  <div>
                    <div className="text-slate-700 mb-2 text-sm">Lessons Learned</div>
                    <p className="text-slate-600 text-sm">{entry.lessonsLearned}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No journal entries found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Add Your First Entry
              </button>
            </div>
          )}
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
                    <strong>Trade data is auto-imported from MetaTrader.</strong> You can edit any field if needed (e.g., to add missing data or make corrections).
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