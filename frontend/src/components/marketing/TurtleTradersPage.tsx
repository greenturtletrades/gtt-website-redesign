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
    detail: "Higher percentile performance carries more weight because it shows how strongly a trader is performing against the rest of the board.",
  },
  {
    name: "Risk Per Trade",
    weight: "30%",
    detail: "We value traders who keep position risk controlled instead of forcing performance with oversized exposure.",
  },
  {
    name: "Total Trades",
    weight: "20%",
    detail: "A larger verified sample matters more than a short burst of good results.",
  },
  {
    name: "Risk Score",
    weight: "15%",
    detail: "Lower and more disciplined risk ranks above unstable or inconsistent exposure.",
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
      <section className="w-full bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-50 py-16 sm:py-20 px-4 sm:px-6 relative overflow-hidden text-slate-950">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -top-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-br from-teal-200 to-cyan-200 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-tr from-cyan-200 to-teal-200 blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d948808_1px,transparent_1px),linear-gradient(to_bottom,#0d948808_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mb-12 text-center">
            <h1 className="text-4xl leading-tight text-slate-900 sm:text-5xl md:text-6xl tracking-tight">Turtle Traders Leaderboard</h1>
            <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
              If a trader is not verified with us, investors should not be expected to trust the performance being shown.
            </p>
          </div>

          <div className="mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex flex-col gap-2 border-b border-teal-200 bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-white">Ranked by verified journal data</div>
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-50">Updated as traders submit data</div>
            </div>
            <div className="overflow-x-auto p-2 sm:p-3">
              <table className="w-full min-w-[920px]">
                <thead className="bg-slate-50">
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
                    <tr key={trader.name} className="border-t border-slate-100 transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-teal-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-xs font-semibold text-teal-700">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-950">{trader.name}</div>
                            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Verified</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
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

          <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-slate-950 shadow-lg">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-2xl text-slate-900">How we decide who is best</h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                  The leaderboard is designed to reward traders who perform well consistently, with verified data and disciplined risk control.
                </p>
              </div>
              <div className="rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white">
                Scoring model
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {scoringModel.map((item) => (
                <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm uppercase tracking-[0.16em] text-slate-600">{item.name}</div>
                  <div className="mt-3 text-3xl text-slate-900">{item.weight}</div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm leading-relaxed text-slate-700">
              Two traders can show similar results while taking very different levels of risk. The stronger rank goes to the trader delivering cleaner performance with better control.
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigateLegal={onNavigateLegal} />
    </div>
  );
}
