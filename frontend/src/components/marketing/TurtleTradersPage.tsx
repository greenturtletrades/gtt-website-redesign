import { Footer } from "./Footer";

interface TurtleTradersPageProps {
  onNavigateLegal?: (page: "terms" | "privacy" | "risk-disclosure" | "contact") => void;
}

const traders = [
  {
    name: "Toni",
    market: "Indices",
    percentilePnl: "98%",
    riskPerTrade: "0.75%",
    totalTrades: 184,
    riskLevel: "Low",
    lastUpdated: "2h ago",
  },
  {
    name: "Praise M.",
    market: "FX",
    percentilePnl: "95%",
    riskPerTrade: "1.00%",
    totalTrades: 201,
    riskLevel: "Medium",
    lastUpdated: "5h ago",
  },
  {
    name: "Javan B.",
    market: "Indices",
    percentilePnl: "93%",
    riskPerTrade: "0.60%",
    totalTrades: 166,
    riskLevel: "Low",
    lastUpdated: "1d ago",
  },
  {
    name: "Patricia P.",
    market: "Commodities",
    percentilePnl: "89%",
    riskPerTrade: "1.20%",
    totalTrades: 148,
    riskLevel: "Medium",
    lastUpdated: "1d ago",
  },
  {
    name: "Finlay T.",
    market: "FX",
    percentilePnl: "86%",
    riskPerTrade: "1.80%",
    totalTrades: 139,
    riskLevel: "High",
    lastUpdated: "2d ago",
  },
  {
    name: "L. Harper",
    market: "Stocks",
    percentilePnl: "83%",
    riskPerTrade: "0.90%",
    totalTrades: 122,
    riskLevel: "Medium",
    lastUpdated: "3d ago",
  },
];

const scoringModel = [
  {
    name: "Percentile PNL",
    weight: "35%",
    detail: "The stronger the trader performs against the rest of the board, the more weight they carry.",
  },
  {
    name: "Average R",
    weight: "30%",
    detail: "Higher returns per unit of risk rank better than raw profit without efficiency.",
  },
  {
    name: "Total Trades",
    weight: "20%",
    detail: "A wider sample beats a short hot streak. Repetition matters.",
  },
  {
    name: "Risk Score",
    weight: "15%",
    detail: "Lower and more controlled exposure ranks above unstable risk taking.",
  },
];

function riskPillClass(riskLevel: string) {
  if (riskLevel === "Low") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (riskLevel === "Medium") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-rose-100 text-rose-700";
}

export function TurtleTradersPage({ onNavigateLegal }: TurtleTradersPageProps) {
  return (
    <div className="min-h-screen bg-white pt-20">
      <section className="bg-[#f4f7f8] px-4 py-16 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-10 text-center">
            <h1 className="text-4xl leading-tight text-slate-900 sm:text-5xl">Turtle Traders Leaderboard</h1>
            <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
              If a trader is not verified with us, investors should not be expected to trust the performance being shown.
            </p>
          </div>

          <div className="mx-auto overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(2,12,20,0.08)]">
            <div className="flex flex-col gap-2 border-b border-slate-200 bg-teal-600 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-white">Ranked by verified journal data</div>
              <div className="text-xs uppercase tracking-[0.18em] text-teal-50">Updated as traders submit data</div>
            </div>
            <div className="overflow-x-auto px-2 pb-2 sm:px-3 sm:pb-3">
              <table className="w-full min-w-[920px]">
                <thead className="bg-[#eef3f5]">
                  <tr>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600">Trader</th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600">Market</th>
                    <th className="px-5 py-4 text-right text-[11px] uppercase tracking-[0.2em] text-slate-600">Percentile PNL</th>
                    <th className="px-5 py-4 text-right text-[11px] uppercase tracking-[0.2em] text-slate-600">Risk Per Trade</th>
                    <th className="px-5 py-4 text-right text-[11px] uppercase tracking-[0.2em] text-slate-600">Total Trades</th>
                    <th className="px-5 py-4 text-center text-[11px] uppercase tracking-[0.2em] text-slate-600">Risk Level</th>
                    <th className="px-5 py-4 text-right text-[11px] uppercase tracking-[0.2em] text-slate-600">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {traders.map((trader, index) => (
                    <tr key={trader.name} className="border-t border-slate-200 transition-colors odd:bg-white even:bg-slate-50/55 hover:bg-teal-50/45">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-900 shadow-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-950">{trader.name}</div>
                            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Verified</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                          {trader.market}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-slate-950">{trader.percentilePnl}</td>
                      <td className="px-5 py-4 text-right text-sm font-medium tabular-nums text-slate-950">{trader.riskPerTrade}</td>
                      <td className="px-5 py-4 text-right text-sm font-medium tabular-nums text-slate-950">{trader.totalTrades}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskPillClass(trader.riskLevel)}`}>
                          {trader.riskLevel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm tabular-nums text-slate-700">{trader.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_24px_70px_rgba(2,12,20,0.06)]">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-2xl text-slate-900">How we decide who is best</h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                  The board score is not just raw profit. It rewards traders who produce strong returns with repeatability and controlled risk.
                </p>
              </div>
              <div className="rounded-full bg-teal-600 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white">
                Scoring model
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {scoringModel.map((item) => (
                <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-sm uppercase tracking-[0.16em] text-slate-600">{item.name}</div>
                  <div className="mt-3 text-3xl text-slate-900">{item.weight}</div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm leading-relaxed text-slate-700">
              Risk score matters because two traders can post similar returns while taking completely different levels of exposure. The better rank goes to the trader producing cleaner results with more controlled risk.
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigateLegal={onNavigateLegal} />
    </div>
  );
}
