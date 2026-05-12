import { Trophy, ShieldCheck, TrendingUp, Medal, BarChart3, Clock3, ArrowUpRight } from "lucide-react";
import { Footer } from "./Footer";

interface TurtleTradersPageProps {
  onNavigateLegal?: (page: "terms" | "privacy" | "risk-disclosure" | "contact") => void;
}

const leaderboard = [
  {
    rank: 1,
    trader: "Toni",
    country: "United Kingdom",
    strategy: "London breakout",
    winRate: "68%",
    totalR: "+42.6R",
    consistency: "94/100",
    journaledTrades: 184,
    streak: "9 green weeks",
  },
  {
    rank: 2,
    trader: "Praise M.",
    country: "Nigeria",
    strategy: "Trend continuation",
    winRate: "64%",
    totalR: "+37.1R",
    consistency: "91/100",
    journaledTrades: 201,
    streak: "7 green weeks",
  },
  {
    rank: 3,
    trader: "Javan B.",
    country: "United Kingdom",
    strategy: "Index momentum",
    winRate: "61%",
    totalR: "+31.4R",
    consistency: "88/100",
    journaledTrades: 166,
    streak: "5 green weeks",
  },
  {
    rank: 4,
    trader: "Finlay T.",
    country: "Scotland",
    strategy: "Swing structure",
    winRate: "58%",
    totalR: "+24.8R",
    consistency: "85/100",
    journaledTrades: 139,
    streak: "4 green weeks",
  },
];

const spotlightStats = [
  { label: "Verified journal submissions", value: "1,280+", icon: ShieldCheck },
  { label: "Average top-10 win rate", value: "63%", icon: TrendingUp },
  { label: "Median holding time", value: "2.8h", icon: Clock3 },
  { label: "Public traders showcased", value: "42", icon: Trophy },
];

const submissionRules = [
  "Rankings are based on verified Trader Journal data, not self-reported screenshots.",
  "Only traders with a minimum sample size and recent activity are featured publicly.",
  "Profiles can display alias-only branding if traders do not want their full name shown.",
  "The long-term goal is to let traders opt in to public profiles directly from the journal.",
];

export function TurtleTradersPage({ onNavigateLegal }: TurtleTradersPageProps) {
  return (
    <div className="min-h-screen bg-white pt-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-950 px-4 py-20 sm:px-6 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_28%)]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:5rem_5rem]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-400/10 px-4 py-2 text-sm text-teal-100">
                <Trophy className="h-4 w-4" />
                Public leaderboard concept
              </div>
              <h1 className="max-w-3xl text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                Turtle Traders
                <span className="block bg-gradient-to-r from-teal-300 via-cyan-200 to-teal-200 bg-clip-text text-transparent">
                  the public leaderboard for disciplined journaled performance
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
                This page showcases traders who opt in from the Trader Journal, submit verified performance data,
                and earn a place on a public leaderboard built around consistency, execution quality, and real trade history.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3 text-white transition hover:from-teal-600 hover:to-cyan-600">
                  Join the leaderboard waitlist
                </button>
                <button className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-slate-100 transition hover:bg-white/10">
                  See submission criteria
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.24em] text-teal-200">Live concept board</div>
                  <div className="mt-1 text-2xl text-white">Top Journaled Traders</div>
                </div>
                <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-200">
                  Weekly refresh
                </div>
              </div>
              <div className="space-y-3">
                {leaderboard.slice(0, 3).map((row) => (
                  <div
                    key={row.rank}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-400 text-slate-950">
                      {row.rank === 1 ? <Trophy className="h-5 w-5" /> : row.rank === 2 ? <Medal className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-white">{row.trader}</div>
                      <div className="text-sm text-slate-300">{row.strategy} · {row.country}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg text-emerald-300">{row.totalR}</div>
                      <div className="text-xs text-slate-300">{row.winRate} win rate</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-teal-300/30 bg-teal-400/5 px-4 py-3 text-sm text-teal-100">
                Future version: journal-linked public profiles, filters by market and timeframe, and seasonal rankings.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
          {spotlightStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">{stat.label}</div>
                  <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 text-3xl text-slate-900">{stat.value}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div>
                <h2 className="text-2xl text-slate-900">Leaderboard Preview</h2>
                <p className="mt-1 text-sm text-slate-600">A public view built from Trader Journal submissions.</p>
              </div>
              <div className="hidden rounded-full bg-slate-900 px-3 py-1 text-xs text-white sm:block">
                Monthly season
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-500">Rank</th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-500">Trader</th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-500">Strategy</th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-500">Win Rate</th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-500">Total R</th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-500">Consistency</th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-slate-500">Journaled Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row) => (
                    <tr key={row.rank} className="border-t border-slate-100">
                      <td className="px-6 py-5 text-slate-900">#{row.rank}</td>
                      <td className="px-6 py-5">
                        <div className="text-slate-900">{row.trader}</div>
                        <div className="text-sm text-slate-500">{row.country}</div>
                      </td>
                      <td className="px-6 py-5 text-slate-700">{row.strategy}</td>
                      <td className="px-6 py-5 text-slate-900">{row.winRate}</td>
                      <td className="px-6 py-5 text-emerald-600">{row.totalR}</td>
                      <td className="px-6 py-5 text-slate-900">{row.consistency}</td>
                      <td className="px-6 py-5 text-slate-700">{row.journaledTrades}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-teal-50 via-cyan-50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-900 p-3 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl text-slate-900">How ranking works</h3>
                  <p className="text-sm text-slate-600">The concept is designed around quality, not hype.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {submissionRules.map((rule) => (
                  <div key={rule} className="flex gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                    <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-700" />
                    <p className="text-sm leading-relaxed text-slate-700">{rule}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <div className="text-sm uppercase tracking-[0.24em] text-teal-300">Public profile spotlight</div>
              <div className="mt-3 text-2xl">Why this could work for Green Turtle Trades</div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
                <p>
                  It gives strong traders public proof, gives new visitors social proof, and gives the Trader Journal a visible reason to submit clean data consistently.
                </p>
                <p>
                  Later, this can evolve into seasonal prizes, category leaderboards, or capital allocation signals tied to verified discipline rather than raw gambling-style returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigateLegal={onNavigateLegal} />
    </div>
  );
}
