import { ExternalLink } from "lucide-react";
import type { ViewType } from "../../seo/routes";

interface SearchPresenceSectionProps {
  onNavigate?: (page: ViewType) => void;
}

const internalLinks: Array<{ label: string; description: string; view: ViewType }> = [
  {
    label: "Green Turtle Trades",
    description: "Official company overview for Green Turtle Trades and Green Turtle Traders searches.",
    view: "seo-green-turtle-trades",
  },
  {
    label: "Investment Competition",
    description: "Public university investment competition and student trader rankings.",
    view: "seo-investment-competition",
  },
  {
    label: "University Competition",
    description: "Live Scottish university leaderboard, trader scores, returns, risk, and backers.",
    view: "turtle-traders",
  },
  {
    label: "Prop Firm Alternative",
    description: "A transparent alternative to prop firm challenges built around verified trader data.",
    view: "seo-prop-firm-alternative",
  },
  {
    label: "Trading Performance Tracker",
    description: "Performance tracking, analytics, risk review, and trader records.",
    view: "seo-trading-performance-tracker",
  },
  {
    label: "Trading Analytics",
    description: "Turtle Analytics for journal records, expectancy, win rate, drawdown, and risk.",
    view: "turtle-analytics",
  },
];

const socialLinks = [
  ["LinkedIn", "https://www.linkedin.com/company/green-turtle-trade/posts/?feedView=all"],
  ["Instagram", "https://www.instagram.com/greenturtletrades_/"],
  ["TikTok", "https://www.tiktok.com/@greenturtletrades"],
  ["X", "https://x.com/GreenTurtleT"],
  ["YouTube", "https://www.youtube.com/@GreenTurtleTrades"],
] as const;

export function SearchPresenceSection({ onNavigate }: SearchPresenceSectionProps) {
  return (
    <section className="w-full bg-white px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Official Green Turtle Trades Pages</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Find the right Green Turtle Trades result</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Green Turtle Trades, also searched as Green Turtle Traders, covers trading analytics, trader-backed investing,
            university investment competitions, and transparent trader performance data.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {internalLinks.map((link) => (
            <button
              key={link.view}
              type="button"
              onClick={() => onNavigate?.(link.view)}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition-colors hover:border-teal-300 hover:bg-teal-50/60"
            >
              <span className="text-sm font-semibold text-slate-950">{link.label}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">{link.description}</span>
            </button>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-200 pt-5 text-sm">
          <span className="font-medium text-slate-950">Official social profiles</span>
          {socialLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-teal-700"
            >
              {label}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
