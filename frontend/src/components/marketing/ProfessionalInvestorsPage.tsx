import { useState } from "react";
import { AlertTriangle, ArrowRight, Building2, Cpu, Landmark } from "lucide-react";
import type { ViewType } from "../../seo/routes";
import { Footer } from "./Footer";
import { CheckList, CtaBand, FaqList, NoticeBanner, PageShell, ProposedBadge, SectionHeading, StepTimeline, type FaqItem, type Step } from "./PageBlocks";

type Navigate = (view: ViewType) => void;

const journeySteps: Step[] = [
  { title: "Enquiry", description: "Tell us about yourself or your organisation and what you are looking for." },
  { title: "Assessment", description: "The regulated firm assesses your client categorisation and the suitability of the service." },
  { title: "Account and mandate", description: "An account is opened in your name and a mandate sets the strategies, sizing and risk limits." },
  { title: "Funding and activation", description: "You fund the account at the broker or custodian. Copying starts once the mandate is active." },
  { title: "Reporting and changes", description: "You receive regular reports and can change or end your mandate on agreed notice." },
];

const parties = [
  {
    icon: Landmark,
    title: "Client account",
    sub: "At the broker or custodian",
    items: ["Held in your name", "Holds your money and positions", "Executes the trades placed for you", "Provides independent statements"],
  },
  {
    icon: Building2,
    title: "Investment manager",
    sub: "The regulated host firm",
    items: ["Categorises and onboards clients", "Agrees and manages your mandate", "Responsible for investment decisions and oversight", "Handles complaints and regulatory reporting"],
  },
  {
    icon: Cpu,
    title: "GTT",
    sub: "Copying technology",
    items: ["Sources and verifies traders", "Copies trades within the mandate's limits", "Reconciles positions with the broker", "Produces performance reporting"],
  },
];

const fees = [
  { name: "Management fee", base: "1.25%", vat: "1.50%", basis: "Per year, on the value of your account" },
  { name: "Performance fee", base: "20%", vat: "24%", basis: "Of eligible profit above a high-water mark" },
  { name: "Minimum allocation", base: "£10,000", vat: "£10,000", basis: "Per trader you allocate to" },
];

const investorFaqs: FaqItem[] = [
  { question: "Who holds my money?", answer: "Your money stays in an account in your name at a broker or custodian. Neither GTT nor the traders can withdraw it." },
  { question: "Can I choose which traders I follow?", answer: "Your mandate sets which verified strategies your account follows and how much is allocated to each, subject to the minimum per trader. The investment manager confirms the final allocation." },
  { question: "How are traders selected?", answer: "Traders apply with their CV and live trading records. We verify their history against broker statements, review their strategy and risk control, and the regulated host completes its own assessment before any client money is linked." },
  { question: "Can I stop or change my allocation?", answer: "Yes. You can change or end your mandate on the notice period set out in your agreement. Open positions are closed or transferred as the agreement describes." },
];

export function ProfessionalInvestorsPage({ onNavigate }: { onNavigate?: Navigate }) {
  const [includeVat, setIncludeVat] = useState(false);
  const enquire = () => onNavigate?.("investor-enquire");
  const enquireButton = <button type="button" className="home-brand-button gtt-button-investor" onClick={enquire}>Enquire about access<ArrowRight size={18} aria-hidden="true" /></button>;

  return <PageShell tone="investor">
    <section className="gtt-hero gtt-hero-left" aria-labelledby="investors-title">
      <div className="home-section-inner">
        <span className="home-kicker" style={{ color: "#0e7490" }}>For investors</span>
        <h1 id="investors-title">Professional Investors</h1>
        <NoticeBanner><strong>For professional clients only.</strong> The service is in development and subject to a regulated arrangement.</NoticeBanner>
        <p className="gtt-hero-lead">
          Access trading strategies from independently verified traders, copied into an account held in your name and
          managed under a mandate you agree. Every trader's record is checked against their broker's statements
          before any client money is linked.
        </p>
        <div className="gtt-hero-actions">{enquireButton}</div>
      </div>
    </section>

    <section className="gtt-section" aria-labelledby="access-title">
      <div className="home-section-inner gtt-narrow">
        <SectionHeading align="left" id="access-title" kicker="Eligibility" title="Who can access the service" />
        <div className="gtt-prose">
          <p>
            The service is only available to professional clients as defined in the FCA Handbook (COBS 3.5). This
            includes certain institutions and organisations, and individuals who can be treated as elective
            professional clients after the regulated firm assesses their expertise, experience and knowledge.
          </p>
          <p>
            Ticking a box on a form or allocating a large amount does not make you a professional client. Your
            categorisation is decided by the regulated firm during assessment, and you will be told the protections
            you give up as a professional client before you agree.
          </p>
        </div>
      </div>
    </section>

    <section className="gtt-section gtt-section-tint" aria-labelledby="journey-title">
      <div className="home-section-inner">
        <SectionHeading id="journey-title" kicker="Your journey" title="From enquiry to reporting" />
        <StepTimeline steps={journeySteps} />
        <div className="gtt-hero-actions" style={{ marginTop: 48 }}>{enquireButton}</div>
      </div>
    </section>

    <section className="gtt-section" aria-labelledby="parties-title">
      <div className="home-section-inner">
        <SectionHeading id="parties-title" kicker="Structure" title="Accounts and responsibilities" intro="Three parties, each with a defined role. Your money stays with the broker or custodian throughout." />
        <div className="gtt-parties">
          {parties.map(({ icon: Icon, title, sub, items }) => <div className="gtt-party" key={title}>
            <div className="gtt-party-head"><span className="gtt-card-icon" style={{ margin: 0 }}><Icon size={22} aria-hidden="true" /></span><h3>{title}</h3></div>
            <p className="gtt-party-sub">{sub}</p>
            <CheckList items={items} />
          </div>)}
        </div>
        <div className="gtt-flow" aria-hidden="true"><span>Trader's account</span><ArrowRight size={16} /><span>GTT copies within limits</span><ArrowRight size={16} /><span>Your account at the broker</span></div>
      </div>
    </section>

    <section className="gtt-section gtt-section-tint" aria-labelledby="risk-title">
      <div className="home-section-inner gtt-narrow">
        <SectionHeading align="left" id="risk-title" kicker="Copying and risk" title="How trades reach your account" />
        <div className="gtt-two-col gtt-prose">
          <div>
            <h3>Sizing and checks</h3>
            <p>Each trade is scaled to your allocation and checked against your mandate's limits on position size, exposure and drawdown before it is placed. Trades that would breach a limit are reduced or not copied.</p>
          </div>
          <div>
            <h3>Why your results can differ</h3>
            <p>Your results will not exactly match the trader's. Execution prices, timing, minimum trade sizes, fees and trades skipped by risk checks all create differences.</p>
          </div>
        </div>
        <div className="gtt-risk" role="note">
          <h3><AlertTriangle size={18} aria-hidden="true" />Capital at risk</h3>
          <p>Trading leveraged products such as CFDs and FX carries a high level of risk and you can lose some or all of your investment. Past performance of a trader is not a reliable indicator of future results.</p>
        </div>
      </div>
    </section>

    <section className="gtt-section" aria-labelledby="fees-title">
      <div className="home-section-inner gtt-narrow">
        <div className="gtt-section-toprow">
          <SectionHeading align="left" id="fees-title" kicker="Fees" title="What it costs" />
          <ProposedBadge>Proposed terms, subject to host</ProposedBadge>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <div className="gtt-toggle" role="group" aria-label="Show fees">
            <button type="button" aria-pressed={!includeVat} onClick={() => setIncludeVat(false)}>Excluding VAT</button>
            <button type="button" aria-pressed={includeVat} onClick={() => setIncludeVat(true)}>Including VAT</button>
          </div>
        </div>
        <div className="gtt-table-wrap">
          <table className="gtt-table">
            <thead><tr><th scope="col">Fee</th><th scope="col">Rate{includeVat ? " (incl. VAT)" : ""}</th><th scope="col">Basis</th></tr></thead>
            <tbody>
              {fees.map((fee) => <tr key={fee.name}><td>{fee.name}</td><td>{includeVat ? fee.vat : fee.base}</td><td>{fee.basis}</td></tr>)}
            </tbody>
          </table>
        </div>
        <p className="gtt-fine">Proposed terms as of October 2026, subject to agreement with the regulated host. VAT at 20% applies to management and performance fees. Final fees are set out in your client agreement.</p>
      </div>
    </section>

    <section className="gtt-section gtt-section-tint" aria-labelledby="investor-faq-title">
      <div className="home-section-inner gtt-narrow">
        <SectionHeading align="left" id="investor-faq-title" kicker="Questions answered" title="Common questions" />
        <FaqList items={investorFaqs} />
      </div>
    </section>

    <CtaBand
      title="Interested in access?"
      text="Start with an enquiry. A member of the team will contact you to discuss the service and next steps."
      small="Launch status, October 2026: in development with a regulated host. Not yet open to clients."
    >
      {enquireButton}
    </CtaBand>
    <Footer onNavigate={onNavigate} />
  </PageShell>;
}
