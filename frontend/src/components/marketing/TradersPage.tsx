import { ArrowRight, CalendarClock, ChartNoAxesCombined, FileSpreadsheet, FileText, FileUser, LineChart, MessagesSquare, MonitorCog, ReceiptText, ShieldAlert } from "lucide-react";
import type { ViewType } from "../../seo/routes";
import { Footer } from "./Footer";
import { CtaBand, FaqList, PageShell, SectionHeading, StepTimeline, type FaqItem, type Step } from "./PageBlocks";

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
  { icon: FileUser, title: "Your CV", description: "PDF, DOC or DOCX, up to 10 MB." },
  { icon: ReceiptText, title: "Broker statement", description: "A PDF statement from your broker covering your live history." },
  { icon: FileSpreadsheet, title: "Trade history export", description: "CSV or XLSX export of every trade, from MT4, MT5 or your platform." },
  { icon: ChartNoAxesCombined, title: "Balance and equity history", description: "Deposits, withdrawals and equity over time, so returns can be recalculated." },
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
            <span className="gtt-card-icon"><Icon size={24} strokeWidth={1.75} aria-hidden="true" /></span>
            <div><strong>{title}</strong><span>{description}</span></div>
          </li>)}
        </ul>
        <p className="gtt-fine"><FileText size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} aria-hidden="true" />A link to your trading record on Myfxbook, FX Blue, ShowMyTrades or a similar platform that connects to MetaTrader is helpful but optional. We still verify your history against your broker statements.</p>
      </div>
    </section>

    <section className="gtt-section gtt-section-tint" aria-labelledby="pay-title">
      <div className="home-section-inner gtt-narrow">
        <div className="gtt-section-toprow">
          <SectionHeading align="left" id="pay-title" kicker="Remuneration" title="Your share of performance fees" />
        </div>
        <div className="gtt-prose">
          <p>
            You receive a share of the performance fees earned on eligible gains in client accounts following
            your strategy. Your share is 50% of the fee in the first two return bands, rising to 80% in the
            bands above 10%.
          </p>
        </div>
        <div className="gtt-table-wrap" role="region" aria-label="Proposed trader performance fee bands" tabIndex={0}>
          <table className="gtt-table">
            <thead>
              <tr>
                <th scope="col">Eligible return band</th>
                <th scope="col">Client fee on that slice</th>
                <th scope="col">Your share of the fee</th>
                <th scope="col">GTT share of the fee</th>
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row">Hurdle to 5%</th><td>10%</td><td>50%</td><td>50%</td></tr>
              <tr><th scope="row">5% to 10%</th><td>12.5%</td><td>50%</td><td>50%</td></tr>
              <tr><th scope="row">10% to 15%</th><td>15%</td><td>80%</td><td>20%</td></tr>
              <tr><th scope="row">Above 15%</th><td>20%</td><td>80%</td><td>20%</td></tr>
            </tbody>
          </table>
        </div>
        <p className="gtt-fine">Bands are marginal: each rate applies only to the eligible gains within that slice, after both the hurdle and high-water-mark tests are met. Your percentage is a share of the performance fee, rather than of the client’s total profit.</p>
        <div className="gtt-prose" style={{ marginTop: 28 }}>
          <h3>When performance fees become eligible</h3>
          <FaqList items={[
            {
              question: "Above the hurdle",
              answer: "Client returns must exceed the UK risk-free-rate hurdle before performance fees become eligible. Below the hurdle, no performance fee is due and no trader performance-fee share is earned.",
            },
            {
              question: "Above each client’s high-water mark",
              answer: "Previous losses must be recovered before new performance fees become eligible. Each client’s reference peak is adjusted for deposits and withdrawals. Returning to that peak earns no performance fee, and unrecovered losses carry forward across fee periods so the same gains are never charged twice.",
            },
          ]} />
        </div>
        <p className="gtt-fine">Proposed terms as of October 2026, subject to agreement with the regulated host. The sterling hurdle benchmark, calculation period and fixing or reset method will be agreed with the host and stated in client terms. Final remuneration terms are set out in your agreement.</p>
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
