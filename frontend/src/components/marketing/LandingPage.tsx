import { useRef } from "react";
import { Hero } from "./Hero";
import { ProductSummary } from "./ProductSummary";
import { PlatformPreview } from "./PlatformPreview";
import { ValuePropositions } from "./ValuePropositions";
import { Footer } from "./Footer";
import { TurtleAnalyticsFeature } from "./TurtleAnalyticsFeature";
import { ScrollProgress } from "./ScrollProgress";
import { WaitingListSignup } from "./WaitingListSignup";
import type { ViewType } from "../../seo/routes";

interface LandingPageProps {
  onTraderClick: () => void;
  onApplyClick: () => void;
  onNavigate?: (page: ViewType) => void;
  mlEnabled?: boolean;
}

export function LandingPage({
  onTraderClick,
  onApplyClick,
  onNavigate,
  mlEnabled = false,
}: LandingPageProps) {
  const waitingListRef = useRef<HTMLDivElement>(null);

  const scrollToWaitingList = () => {
    waitingListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <ScrollProgress />
      <Hero
        onTraderClick={onTraderClick}
        onApplyClick={onApplyClick}
        onScrollToWaitingList={scrollToWaitingList}
      />
      <ProductSummary />
      <PlatformPreview />
      <TurtleAnalyticsFeature mlEnabled={mlEnabled} />
      <ValuePropositions />
      <div ref={waitingListRef}>
        <WaitingListSignup />
      </div>
      <section className="w-full bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
              Learn more
            </div>
            <h2 className="mt-2 text-3xl text-slate-950">Explore trading performance topics</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Trading Analytics", "seo-trading-analytics"],
              ["Trading Journal", "seo-trading-journal"],
              ["Verified Traders", "seo-verified-traders"],
              ["Investor Capital for Traders", "seo-investor-capital"],
              ["Trader Marketplace", "seo-trader-marketplace"],
              ["Copy Trading Platform", "seo-copy-trading-platform"],
              ["Trader Funding", "seo-trader-funding"],
              ["Prop Firm Alternative", "seo-prop-firm-alternative"],
              ["Trading Performance Tracker", "seo-trading-performance-tracker"],
              ["Trading Risk Management", "seo-trading-risk-management"],
              ["MT4 and MT5 Trading Journal", "seo-mt4-mt5-trading-journal"],
              ["Traders Leaderboard", "turtle-traders"],
            ].map(([label, view]) => (
              <button
                key={view}
                type="button"
                onClick={() => onNavigate?.(view as ViewType)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm text-slate-700 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <Footer onNavigate={onNavigate} />
    </>
  );
}
