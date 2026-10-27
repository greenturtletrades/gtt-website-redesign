import { ArrowRight, BarChart3, Mail, ShieldCheck, Trophy } from "lucide-react";
import analyticsPreview from "../../assets/app-preview/analytics-workspace.png";
import type { ViewType } from "../../seo/routes";
import { isInvestorPageLive } from "../../featureFlags";
import { RouteCard, SectionHeading, StepTimeline, type Step } from "./PageBlocks";

type Navigate = (view: ViewType) => void;

const howItWorksSteps: Step[] = [
  { title: "Trader verified", description: "We review the trader's CV and live trading records before anything else happens." },
  { title: "Authorised connection", description: "The trader keeps their own broker account and authorises a read connection to it." },
  { title: "Copied within limits", description: "Trades are sized to each client's mandate and checked against agreed risk limits." },
  { title: "Ongoing reporting", description: "Positions are reconciled with the broker and reported to clients and the regulated host." },
];

export function HowItWorks() {
  return <section className="gtt-section gtt-section-wash" aria-labelledby="how-it-works-title">
    <div className="home-section-inner">
      <SectionHeading
        id="how-it-works-title"
        kicker="How it works"
        title="From a verified record to a managed account"
        intro="Four steps connect a trader's strategy to a professional client's account. Each one is checked before the next begins."
      />
      <StepTimeline steps={howItWorksSteps} />
    </div>
  </section>;
}

export function RouteCards({ onNavigate }: { onNavigate?: Navigate }) {
  return <section className="gtt-section" aria-labelledby="routes-title">
    <div className="home-section-inner">
      <SectionHeading id="routes-title" kicker="Choose your route" title="Are you investing or trading?" />
      <div className="gtt-route-grid">
        {isInvestorPageLive && <RouteCard
          tone="investor"
          label="For investors"
          title="Access verified strategies"
          description="For professional clients and organisations looking for exposure to independently verified trading strategies."
          bullets={[
            "Managed accounts held at a broker or custodian in your name",
            "For professional clients only, assessed by the regulated firm",
            "Start with an enquiry. Nothing is committed at this stage",
          ]}
          action="For Investors"
          onAction={() => onNavigate?.("professional-investors")}
        />}
        <RouteCard
          tone="trader"
          label="For traders"
          title="Trade your strategy. Reach professional capital."
          description="For independent traders with a live record they can evidence and a strategy they can explain."
          bullets={[
            "Keep trading from your own broker account",
            "Apply with your CV and live trading record",
            "Earn a share of performance fees on the capital that follows you",
          ]}
          action="For Traders"
          onAction={() => onNavigate?.("traders")}
        />
      </div>
    </div>
  </section>;
}

export function HomeEvidence({ onNavigate }: { onNavigate?: Navigate }) {
  return <section className="gtt-section gtt-section-tint" aria-labelledby="evidence-title">
    <div className="home-section-inner">
      <SectionHeading
        id="evidence-title"
        kicker="Evidence first"
        title="Every strategy starts with a record we can check"
        intro="Returns on their own say little. We look at the full trading history, how risk was taken and whether the record holds up against the broker's own statements."
      />
      <div className="gtt-evidence">
        <figure className="gtt-figure">
          <img src={analyticsPreview} alt="Turtle Analytics workspace showing a trader's performance and risk metrics" loading="lazy" />
          <figcaption><span>Turtle Analytics</span><span className="gtt-badge gtt-badge-muted">Prototype screen</span></figcaption>
        </figure>
        <div className="gtt-evidence-copy">
          <h3>How we verify a record</h3>
          <p>
            We compare the trader's broker statement with their full trade export, recalculate returns and drawdown
            ourselves, and review how positions were sized. Demo and competition records are accepted but assessed
            separately from live trading.
          </p>
          <div className="gtt-hero-actions" style={{ justifyContent: "flex-start" }}>
            <button type="button" className="home-brand-button home-brand-button-secondary" onClick={() => onNavigate?.("turtle-analytics")}>
              <BarChart3 size={18} aria-hidden="true" />Explore Turtle Analytics
            </button>
          </div>
          <article className="gtt-card">
            <div className="gtt-card-icon"><Trophy size={22} aria-hidden="true" /></div>
            <h3>University Investment Competition</h3>
            <p>Our competition gives students a risk-free way to build a trading record with virtual capital and an official leaderboard.</p>
            <button type="button" className="gtt-text-link gtt-card-link" onClick={() => onNavigate?.("turtle-traders")}>
              View the competition<ArrowRight size={16} aria-hidden="true" />
            </button>
          </article>
        </div>
      </div>
    </div>
  </section>;
}

export function StatusContact({ onNavigate }: { onNavigate?: Navigate }) {
  return <section className="gtt-cta" aria-labelledby="status-title">
    <div className="home-section-inner">
      <span className="home-kicker" style={{ color: "#5eead4" }}><ShieldCheck size={15} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} aria-hidden="true" />Status as of October 2026</span>
      <h2 id="status-title" style={{ marginTop: 12 }}>In development, with a regulated partner</h2>
      <p>
        The investment service is being built with a regulated host firm and is not yet open to clients. We are
        reviewing trader applications now and taking enquiries from professional investors.
      </p>
      <div className="gtt-hero-actions">
        {isInvestorPageLive && (
          <button type="button" className="home-brand-button gtt-button-investor" onClick={() => onNavigate?.("professional-investors")}>
            For Investors<ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
        <button type="button" className="home-brand-button home-brand-button-secondary" onClick={() => onNavigate?.("traders")}>
          For Traders<ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
      <p className="gtt-hero-small">
        <Mail size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} aria-hidden="true" />
        Something else? <button type="button" className="gtt-text-link" onClick={() => onNavigate?.("contact")}>Contact us</button>
      </p>
    </div>
  </section>;
}
