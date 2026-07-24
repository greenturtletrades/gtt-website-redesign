import { ArrowRight, BarChart3, Building2, CircleDollarSign, GraduationCap, ShieldCheck, Trophy, Users } from "lucide-react";
import { Footer } from "./Footer";
import type { ViewType } from "../../seo/routes";
import appPreview from "../../assets/428b6f5c1cfd8d0a25ef455d53076097a058dba9.png";

interface TurtleTradersPageProps {
  onNavigate?: (page: ViewType) => void;
}

const competitionAppUrl = "https://competition.greenturtletraders.co.uk";

const universities = [
  { name: "Heriot-Watt University", domain: "hw.ac.uk" },
  { name: "University of Glasgow", domain: "student.gla.ac.uk" },
  { name: "University of Edinburgh", domain: "ed.ac.uk" },
  { name: "University of Aberdeen", domain: "abdn.ac.uk" },
];

const scoringModel = [
  {
    name: "Win rate",
    weight: "35%",
    detail: "Rewards traders who close positions profitably across completed in-house competition trades.",
  },
  {
    name: "Expectancy",
    weight: "30%",
    detail: "Measures the average edge produced each time a trader takes risk.",
  },
  {
    name: "Trade sample",
    weight: "20%",
    detail: "Gives more confidence to traders with a meaningful number of completed trades.",
  },
  {
    name: "Risk control",
    weight: "15%",
    detail: "Supports disciplined position sizing instead of rewarding oversized exposure.",
  },
];

const rules = [
  {
    icon: GraduationCap,
    title: "University email required",
    text: "Only verified university email accounts can enter the competition environment.",
  },
  {
    icon: CircleDollarSign,
    title: "Demo capital only",
    text: "Traders receive a 100,000 demo market account. Investors receive a 10,000 demo backing account.",
  },
  {
    icon: BarChart3,
    title: "In-house execution",
    text: "Competition rankings come from the internal execution engine, not screenshots or uploaded files.",
  },
  {
    icon: Users,
    title: "Trader backing",
    text: "Participants can back traders with separate demo capital and follow performance through the portfolio view.",
  },
];

export function TurtleTradersPage({ onNavigate }: TurtleTradersPageProps) {
  return (
    <div className="min-h-screen bg-white pt-20">
      <section className="border-b border-slate-200 bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/40 bg-teal-300/10 px-4 py-2 text-sm font-medium text-teal-100">
              <Trophy className="h-4 w-4" />
              University trading competition
            </div>
            <h1 className="max-w-4xl text-4xl leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
              The UK university trading competition for verified student traders.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Green Turtle Trades lets university students compete with demo capital, trade live market data through the in-house execution engine, and rank by skill, consistency, and risk control.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={competitionAppUrl}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400"
              >
                Join the competition
                <ArrowRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => onNavigate?.("about")}
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                About Green Turtle Trades
              </button>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {[
                ["100,000", "demo trading account"],
                ["10,000", "demo backing account"],
                ["4", "university groups"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-semibold text-white">{value}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-3 shadow-2xl">
              <img
                src={appPreview}
                alt="Green Turtle Trades competition app portfolio screen"
                className="h-auto w-full rounded-[1.5rem] border border-white/10 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-4">
            {universities.map((university) => (
              <div key={university.domain} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <Building2 className="mb-4 h-6 w-6 text-teal-600" />
                <h2 className="text-lg font-semibold leading-6 text-slate-950">{university.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{university.domain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Leaderboard logic</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Rankings built around repeatable trading skill.</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              The public competition page points students toward the live competition app. Inside the app, rankings are calculated from closed in-house trades, with university-specific leaderboards and an overall leaderboard.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {scoringModel.map((item) => (
              <div key={item.name} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-semibold text-slate-950">{item.name}</h3>
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">{item.weight}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">How it works</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Built for competition accounts, not live funds.</h2>
            </div>
            <a href={competitionAppUrl} className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800">
              Open competition app
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rules.map((rule) => {
              const Icon = rule.icon;
              return (
                <div key={rule.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <Icon className="h-6 w-6 text-teal-600" />
                  <h3 className="mt-5 text-lg font-semibold text-slate-950">{rule.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{rule.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-lg border border-teal-200 bg-teal-50 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-teal-700">
                <ShieldCheck className="h-4 w-4" />
                Verified university access
              </div>
              <h2 className="text-2xl font-semibold text-slate-950">Ready to represent your university?</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-700">
                Sign up with your university email to enter the competition flow. Non-university accounts stay on the main Green Turtle Trades app.
              </p>
            </div>
            <a
              href={competitionAppUrl}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Start competing
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
