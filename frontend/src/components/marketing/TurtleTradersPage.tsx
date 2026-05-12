import { Footer } from "./Footer";

interface TurtleTradersPageProps {
  onNavigateLegal?: (page: "terms" | "privacy" | "risk-disclosure" | "contact") => void;
}

const traders = [
  {
    name: "Toni",
    market: "Indices",
    percentilePnl: "98th",
    averageR: "+2.4R",
    totalTrades: 184,
    riskLevel: "Low",
    boardScore: "94",
  },
  {
    name: "Praise M.",
    market: "FX",
    percentilePnl: "95th",
    averageR: "+2.1R",
    totalTrades: 201,
    riskLevel: "Medium",
    boardScore: "91",
  },
  {
    name: "Javan B.",
    market: "Indices",
    percentilePnl: "93rd",
    averageR: "+1.9R",
    totalTrades: 166,
    riskLevel: "Low",
    boardScore: "88",
  },
  {
    name: "Patricia P.",
    market: "Commodities",
    percentilePnl: "89th",
    averageR: "+1.7R",
    totalTrades: 148,
    riskLevel: "Medium",
    boardScore: "85",
  },
  {
    name: "Finlay T.",
    market: "FX",
    percentilePnl: "86th",
    averageR: "+1.5R",
    totalTrades: 139,
    riskLevel: "High",
    boardScore: "82",
  },
  {
    name: "L. Harper",
    market: "Stocks",
    percentilePnl: "83rd",
    averageR: "+1.3R",
    totalTrades: 122,
    riskLevel: "Medium",
    boardScore: "79",
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
      <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.10),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f4f7f8_100%)] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs uppercase tracking-[0.2em] text-teal-700">
              Public trader board
            </div>
            <h1 className="text-4xl leading-tight text-slate-900 sm:text-5xl">Turtle Traders</h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              A premium public leaderboard for traders using the journal. Clear numbers, strict ranking logic, and no unnecessary extras.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f7f8] px-4 py-14 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl text-slate-950">Top journaled traders</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
                Built like a market board, but for public trader performance. One clean table. One clear scoring model.
              </p>
            </div>
            <div className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs uppercase tracking-[0.18em] text-slate-700">
              Live board preview
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(2,12,20,0.08)]">
            <div className="border-b border-slate-200 bg-slate-900 px-6 py-4 text-sm text-slate-100">
              Ranked by verified journal data
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead className="bg-[#eef3f5]">
                  <tr>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600">Name</th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600">Market</th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600">Percentile PNL</th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600">Average R</th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600">Total Trades</th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600">Risk Level</th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[0.2em] text-slate-600">Board Score</th>
                  </tr>
                </thead>
                <tbody>
                  {traders.map((trader, index) => (
                    <tr key={trader.name} className="border-t border-slate-200">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-medium text-white">
                            {index + 1}
                          </div>
                          <div className="text-sm font-medium text-slate-950">{trader.name}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{trader.market}</td>
                      <td className="px-5 py-4 text-sm text-slate-950">{trader.percentilePnl}</td>
                      <td className="px-5 py-4 text-sm font-medium text-emerald-700">{trader.averageR}</td>
                      <td className="px-5 py-4 text-sm text-slate-950">{trader.totalTrades}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskPillClass(trader.riskLevel)}`}>
                          {trader.riskLevel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-950">{trader.boardScore}</td>
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
