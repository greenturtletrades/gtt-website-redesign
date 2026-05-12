import { Footer } from "./Footer";

interface TurtleTradersPageProps {
  onNavigateLegal?: (page: "terms" | "privacy" | "risk-disclosure" | "contact") => void;
}

const leaderboard = [
  {
    rank: 1,
    trader: "Toni",
    market: "Indices",
    totalR: "+42.6R",
    winRate: "68%",
    consistency: "94",
    journaledTrades: 184,
  },
  {
    rank: 2,
    trader: "Praise M.",
    market: "FX",
    totalR: "+37.1R",
    winRate: "64%",
    consistency: "91",
    journaledTrades: 201,
  },
  {
    rank: 3,
    trader: "Javan B.",
    market: "Indices",
    totalR: "+31.4R",
    winRate: "61%",
    consistency: "88",
    journaledTrades: 166,
  },
  {
    rank: 4,
    trader: "Finlay T.",
    market: "FX",
    totalR: "+24.8R",
    winRate: "58%",
    consistency: "85",
    journaledTrades: 139,
  },
  {
    rank: 5,
    trader: "Patricia P.",
    market: "Commodities",
    totalR: "+22.2R",
    winRate: "56%",
    consistency: "83",
    journaledTrades: 148,
  },
];

const rankingWeights = [
  {
    title: "Consistency",
    weight: "40%",
    description: "The biggest factor. Traders who repeat their process cleanly rank above traders with one-off spikes.",
  },
  {
    title: "Risk-adjusted return",
    weight: "30%",
    description: "We value strong returns, but only when they come with controlled risk and sensible position sizing.",
  },
  {
    title: "Sample size",
    weight: "20%",
    description: "More verified journaled trades means more confidence in the result.",
  },
  {
    title: "Win rate",
    weight: "10%",
    description: "Helpful, but not enough on its own. A high win rate without discipline does not carry the board.",
  },
];

const rules = [
  "Only traders who opt in from the Trader Journal appear publicly.",
  "Rankings are based on journal data, not screenshots or self-reported claims.",
  "Minimum trade count and recent activity are required to stay on the board.",
  "Public profiles can use a first name, alias, or initials.",
];

export function TurtleTradersPage({ onNavigateLegal }: TurtleTradersPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 pt-20 text-white">
      <section className="border-b border-white/10 bg-slate-950 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-teal-200">
              Public leaderboard
            </div>
            <h1 className="text-4xl leading-tight text-white sm:text-5xl">
              Turtle Traders
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              A simple public leaderboard for traders who use the journal, opt in, and want their performance shown in a clean,
              easy-to-understand format.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-4">
              <div className="text-sm text-slate-400">Ranking focus</div>
              <div className="mt-2 text-2xl text-white">Discipline first</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-4">
              <div className="text-sm text-slate-400">Data source</div>
              <div className="mt-2 text-2xl text-white">Trader Journal</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900 px-5 py-4">
              <div className="text-sm text-slate-400">Public entry</div>
              <div className="mt-2 text-2xl text-white">Opt-in only</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl text-slate-950">Leaderboard Preview</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                This is the direction: one clean table, strong contrast, and no clutter. Visitors should understand it in seconds.
              </p>
            </div>
            <div className="rounded-full bg-teal-600 px-4 py-2 text-sm text-white">
              Monthly ranking
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-600">Rank</th>
                    <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-600">Trader</th>
                    <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-600">Market</th>
                    <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-600">Total R</th>
                    <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-600">Win Rate</th>
                    <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-600">Consistency</th>
                    <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-600">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row) => (
                    <tr key={row.rank} className="border-t border-slate-200">
                      <td className="px-5 py-4 text-sm text-slate-950">#{row.rank}</td>
                      <td className="px-5 py-4 text-sm text-slate-950">{row.trader}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{row.market}</td>
                      <td className="px-5 py-4 text-sm font-medium text-emerald-700">{row.totalR}</td>
                      <td className="px-5 py-4 text-sm text-slate-950">{row.winRate}</td>
                      <td className="px-5 py-4 text-sm text-slate-950">{row.consistency}/100</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{row.journaledTrades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h2 className="text-3xl text-white">How the board is ranked</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              The aim is to reward traders who are steady and repeatable, not traders who get one lucky month.
            </p>

            <div className="mt-6 space-y-4">
              {rankingWeights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg text-white">{item.title}</h3>
                    <div className="rounded-full bg-teal-500 px-3 py-1 text-sm text-slate-950">{item.weight}</div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-2xl text-white">Public rules</h2>
              <div className="mt-5 space-y-3">
                {rules.map((rule) => (
                  <div key={rule} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-slate-300">
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-teal-400/20 bg-teal-400/10 p-6">
              <h2 className="text-2xl text-white">Why this works</h2>
              <p className="mt-3 text-sm leading-relaxed text-teal-50">
                It gives traders public proof, gives visitors immediate social proof, and gives the journal a stronger reason to keep data clean and current.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigateLegal={onNavigateLegal} />
    </div>
  );
}
