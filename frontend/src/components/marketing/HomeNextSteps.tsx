import { ArrowRight, Wallet, ChartNoAxesCombined, ShieldCheck, SlidersHorizontal, Monitor, TrendingUp, Brain, ClipboardList } from "lucide-react";

const investorBenefits = [
  { icon: Wallet, title: "Flexible Capital Management", description: "Scale allocations up or down instantly based on trader performance without penalties" },
  { icon: ChartNoAxesCombined, title: "Portfolio Monitoring", description: "Track all your allocations, returns, and performance across multiple traders in real-time" },
  { icon: ShieldCheck, title: "Transparent Trader Performance", description: "Full access to verified metrics, trading history, and risk analytics for every trader" },
  { icon: SlidersHorizontal, title: "Custom Filters & Preferences", description: "Find the perfect traders using advanced filters for strategy, risk level, and performance" },
];
const traderBenefits = [
  { icon: Monitor, title: "Trade From Your Own Account", description: "Use your existing MT4/MT5 platform with no platform switching, trade from the comfort of your own account" },
  { icon: TrendingUp, title: "Build Toward Capital Access", description: "Use verified performance records and risk analytics to support future investor-capital workflows" },
  { icon: Brain, title: "Turtle Analytics", description: "Advanced ML-powered analytics to optimise your performance and refine your trading strategies" },
  { icon: ClipboardList, title: "Transparent Account Workflows", description: "Keep account activity, analytics, and performance summaries in a clearer platform record" },
];

export function HomeNextSteps({ onApplyClick, onInvestorClick }: { onApplyClick: () => void; onInvestorClick: () => void }) {
  return <section className="home-offering" aria-labelledby="home-offering-title">
    <div className="home-section-inner">
      <header className="home-section-heading">
        <span className="home-kicker">One platform. Two perspectives.</span>
        <h2 id="home-offering-title">Everything You Need to<br /><span className="home-invest-text">Invest.</span> <span className="home-trade-text">Trade.</span> <span>Grow.</span></h2>
        <p>Trading skill deserves recognition. Investor decisions deserve clarity. Bring both together with the tools to see the full picture.</p>
      </header>
      <div className="home-audiences">
        {[{ name: "Invest", tone: "invest", benefits: investorBenefits, intro: "A clearer view of where your capital could go.", note: "Explore the investor product with virtual capital. Real-capital access is in development.", action: "Join the Investor Waitlist", onClick: onInvestorClick }, { name: "Trade", tone: "trade", benefits: traderBenefits, intro: "Your skill. Your record. Your next opportunity.", note: "Build your performance record as we develop future investor-capital opportunities.", action: "Apply as a Trader", onClick: onApplyClick }].map(audience => <div className={`home-audience home-audience-${audience.tone}`} key={audience.name}>
          <div className="home-audience-layout">
            <div className="home-audience-heading"><h3>{audience.name}</h3><p>{audience.intro}</p></div>
            <div className="home-benefit-list">{audience.benefits.map(({ icon: Icon, title, description }) => <article className="home-benefit" key={title}><span className="home-benefit-icon"><Icon size={23} aria-hidden="true" /></span><div><h4>{title}</h4><p>{description}</p></div></article>)}</div>
            <div className="home-audience-action"><p>{audience.note}</p><button className="home-brand-button" onClick={audience.onClick}>{audience.action}<ArrowRight size={17} aria-hidden="true" /></button></div>
          </div>
        </div>)}
      </div>
    </div>
  </section>;
}
