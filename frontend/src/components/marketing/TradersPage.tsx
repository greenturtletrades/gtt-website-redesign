import { ArrowRight, CalendarClock, FileSpreadsheet, FileText, Gauge, Landmark, LineChart, MessagesSquare, MonitorCog, ShieldAlert, UserRound } from "lucide-react";
import type { ViewType } from "../../seo/routes";
import { Footer } from "./Footer";
import { CtaBand, FaqList, PageShell, ProposedBadge, SectionHeading, StepTimeline, type FaqItem, type Step } from "./PageBlocks";

type Navigate = (view: ViewType) => void;

const copySteps: Step[] = [
  { title: "Record review", description: "We review your CV, broker statement and full trade history, and recalculate your performance ourselves." },
  { title: "Authorised connection", description: "You authorise a read-only connection to your existing broker account. You never share your password with us." },
  { title: "Trading as usual", description: "You keep trading your strategy from your own account, on your own platform, in your own way." },
  { title: "Controlled copying", description: "Your strategy is reviewed and agreed before any client money is linked. Trades are then copied into client accounts, sized to each mandate and checked against agreed limits." },
  { title: "Monitoring", description: "Positions are reconciled and monitored continuously. If trading moves outside the agreed strategy, copying can be paused." },
];

const requirements = [
  { icon: CalendarClock, title: "12 months of verifiable live history", description: "A continuous live record we can match against your broker's own statements." },
  { icon: LineChart, title: "An explainable strategy", description: "You can describe what you trade, why you enter and exit, and how the approach behaves in different markets." },
  { icon: ShieldAlert, title: "Risk and drawdown control", description: "Consistent position sizing, defined risk per trade and drawdowns you can account for." },
  { icon: MonitorCog, title: "Platform competence", description: "Comfortable on MT4 or MT5, with a stable setup and a broker account in your own name." },
  { icon: MessagesSquare, title: "Communication and monitoring", description: "Willing to tell us about changes to your strategy and to be monitored while client money is linked." },
];

const documents = [
  { icon: UserRound, title: "Your CV", description: "PDF, DOC or DOCX, up to 10 MB." },
  { icon: Landmark, title: "Broker statement", description: "A PDF statement from your broker covering your live history." },
  { icon: FileSpreadsheet, title: "Trade history export", description: "CSV or XLSX export of every trade, from MT4, MT5 or your platform." },
  { icon: Gauge, title: "Balance and equity history", description: "Deposits, withdrawals and equity over time, so returns can be recalculated." },
];

const reviewSteps: Step[] = [
  { title: "CV and evidence review", description: "We check your application is complete and read your CV and supporting documents." },
  { title: "Record verification", description: "We match your trade export against your broker statement and recalculate returns and drawdown." },
  { title: "Strategy call", description: "If your record fits, we arrange a call to talk through your strategy, risk and routine." },
  { title: "Host assessment and agreements", description: "The regulated host firm completes its own assessment before any agreements are signed." },
];

const traderFaqs: FaqItem[] = [
  { question: "What happens to my data?", answer: "Your CV and records are stored privately and only seen by the GTT review team and, if you progress, the regulated host firm. Files are downloaded only through short-lived secure links. You can ask us to delete your application at any time; see our privacy policy for retention periods." },
  { question: "Can I apply with a demo or competition record?", answer: "Yes. Demo and competition records are accepted and reviewed, but they are flagged separately and carry less weight than a live record. Copying client money requires a verified live history." },
  { question: "Will you ask for my account password?", answer: "No. We never ask for account passwords, investor passwords or API keys during the application. Any connection to your broker account is set up later, through an authorised read-only route." },
];

export function TradersPage({ onNavigate }: { onNavigate?: Navigate }) {
  const apply = () => onNavigate?.("trader-apply");
  const applyButton = <button type="button" className="home-brand-button gtt-button-trader" onClick={apply}>Apply as a trader<ArrowRight size={18} aria-hidden="true" /></button>;

  return <PageShell tone="trader">
    <section className="gtt-hero gtt-hero-left" aria-labelledby="traders-title">
      <div className="home-section-inner">
        <span className="home-kicker">For traders</span>
        <h1 id="traders-title">Trade your strategy. Reach professional capital.</h1>
        <p className="gtt-hero-lead">
          If you have a live trading record you can evidence and a strategy you can explain, we want to hear from you.
          You keep trading from your own broker account. We verify your record, and once your strategy is agreed,
          your trades can be copied into accounts managed for professional clients.
        </p>
        <div className="gtt-hero-actions">{applyButton}</div>
        <p className="gtt-hero-small">Applying does not guarantee selection, a contract or investor capital.</p>
      </div>
    </section>

    <section className="gtt-section" aria-labelledby="copy-title">
      <div className="home-section-inner gtt-narrow">
        <SectionHeading align="left" id="copy-title" kicker="How it works" title="How we obtain and copy trades" intro="Five stages, from first review to ongoing monitoring." />
        <StepTimeline steps={copySteps} layout="vertical" />
      </div>
    </section>

    <section className="gtt-section gtt-section-tint" aria-labelledby="assess-title">
      <div className="home-section-inner">
        <div className="gtt-section-toprow">
          <SectionHeading align="left" id="assess-title" kicker="Requirements" title="What we assess" />
          <ProposedBadge />
        </div>
        <div className="gtt-card-grid">
          {requirements.map(({ icon: Icon, title, description }) => <article className="gtt-card" key={title}>
            <div className="gtt-card-icon"><Icon size={22} aria-hidden="true" /></div>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>)}
          <article className="gtt-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", background: "var(--gtt-wash)" }}>
            <h3>Think you fit?</h3>
            <p style={{ marginBottom: 18 }}>The application takes about 20 minutes once your documents are ready.</p>
            {applyButton}
          </article>
        </div>
      </div>
    </section>

    <section className="gtt-section" aria-labelledby="prepare-title">
      <div className="home-section-inner gtt-narrow">
        <SectionHeading align="left" id="prepare-title" kicker="Before you start" title="What to prepare" intro="Gather these before you begin the application so you can complete it in one go." />
        <ul className="gtt-doc-list">
          {documents.map(({ icon: Icon, title, description }) => <li key={title}>
            <span className="gtt-card-icon"><Icon size={20} aria-hidden="true" /></span>
            <div><strong>{title}</strong><span>{description}</span></div>
          </li>)}
        </ul>
        <p className="gtt-fine"><FileText size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} aria-hidden="true" />A link to a verified record (for example Myfxbook) is helpful but optional.</p>
      </div>
    </section>

    <section className="gtt-section gtt-section-tint" aria-labelledby="pay-title">
      <div className="home-section-inner gtt-narrow">
        <div className="gtt-section-toprow">
          <SectionHeading align="left" id="pay-title" kicker="Remuneration" title="Potential remuneration" />
          <ProposedBadge>Proposed terms</ProposedBadge>
        </div>
        <div className="gtt-prose">
          <p>
            Clients pay a 20% performance fee on eligible profit. That fee is split 60/40 between you and the
            platform, so you would receive 12% of eligible profit and the platform 8%. Eligible profit is measured
            above a high-water mark, so losses are recovered before any fee is earned.
          </p>
        </div>
        <div className="gtt-figure-row">
          <div className="gtt-figure-box"><strong>20%</strong><span>Performance fee on eligible profit</span></div>
          <div className="gtt-figure-box"><strong>12%</strong><span>Your share (60% of the fee)</span></div>
          <div className="gtt-figure-box"><strong>8%</strong><span>Platform share (40% of the fee)</span></div>
        </div>
        <p className="gtt-fine">Proposed terms as of October 2026, subject to agreement with the regulated host. Final terms are set out in your agreement.</p>
      </div>
    </section>

    <section className="gtt-section" aria-labelledby="review-title">
      <div className="home-section-inner">
        <SectionHeading id="review-title" kicker="After you apply" title="Review process" intro="We aim to contact you within 10 working days if we'd like to discuss your strategy." />
        <StepTimeline steps={reviewSteps} />
      </div>
    </section>

    <section className="gtt-section gtt-section-tint" aria-labelledby="trader-faq-title">
      <div className="home-section-inner gtt-narrow">
        <SectionHeading align="left" id="trader-faq-title" kicker="Questions" title="Before you apply" />
        <FaqList items={traderFaqs} />
        <p className="gtt-fine">More answers on our <button type="button" className="gtt-text-link" onClick={() => onNavigate?.("faqs")}>FAQs page</button>.</p>
      </div>
    </section>

    <CtaBand title="Ready to apply?" text="Send us your CV and trading record. We review every application." small="Applying does not guarantee selection, a contract or investor capital.">
      {applyButton}
    </CtaBand>
    <Footer onNavigate={onNavigate} />
  </PageShell>;
}
