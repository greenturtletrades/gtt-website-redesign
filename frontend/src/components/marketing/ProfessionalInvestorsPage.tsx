import { useState } from "react";
import { AlertTriangle, ArrowRight, Building2, Cpu, Landmark } from "lucide-react";
import type { ViewType } from "../../seo/routes";
import { NavigationLink } from "../../seo/NavigationLink";
import seo from "../../../seo.config.json";
import copy from "../../../page-copy.json";
import { AudienceResources } from "./AudienceResources";
import feeTerms from "../../../fee-terms.json";
import { FeeCalculator } from "./FeeCalculator";
import { Footer } from "./Footer";
import { CheckList, CtaBand, FaqList, PageShell, SectionHeading, StepTimeline, type FaqItem, type Step } from "./PageBlocks";

type Navigate = (view: ViewType) => void;

const journeySteps: Step[] = [
  { title: "Enquiry", description: "Tell us about yourself or your organisation and what you are looking for." },
  { title: "Assessment", description: "The regulated firm assesses your client categorisation and the suitability of the service." },
  { title: "Broker onboarding and mandate", description: "You complete onboarding with the designated broker. The agreed mandate sets the strategies, allocations and risk limits." },
  { title: "Funding and activation", description: "You fund directly with the designated broker. GTT calculates investor allocations and applies trade filters before approved instructions are sent for execution." },
  { title: "Reporting and changes", description: "You receive regular reports and can change or end your mandate on agreed notice." },
];

const parties = [
  {
    icon: Landmark,
    title: "Designated broker",
    sub: "Client capital and trade execution",
    items: ["Receives client funding directly", "Provides the execution infrastructure", "Executes approved trade instructions", "Provides broker account records"],
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
    sub: "Verification, filters and allocations",
    items: ["Sources and verifies traders", "Filters trades against agreed limits", "Calculates investor allocations per trade", "Reconciles broker execution and reports"],
  },
];

const fees = [
  { name: "Management fee", base: `${feeTerms.managementFeePercent.toFixed(2)}%`, vat: `${(feeTerms.managementFeePercent * (1 + feeTerms.vatPercent / 100)).toFixed(2)}%`, basis: "Per year, on the investor’s total capital on the platform" },
  { name: "Performance fee", base: `${feeTerms.performanceBands[0].clientFeePercent}%–${feeTerms.performanceBands.at(-1)!.clientFeePercent}%`, vat: `${feeTerms.performanceBands[0].clientFeePercent * (1 + feeTerms.vatPercent / 100)}%–${feeTerms.performanceBands.at(-1)!.clientFeePercent * (1 + feeTerms.vatPercent / 100)}%`, basis: "Marginal rates on eligible gains, as shown below" },
  { name: "Minimum allocation", base: "£10,000", vat: "£10,000", basis: "Per trader you allocate to" },
];

const performanceBands = feeTerms.performanceBands.map(band => ({ band: band.label, base: `${band.clientFeePercent}%`, vat: `${band.clientFeePercent * (1 + feeTerms.vatPercent / 100)}%` }));

const investorFaqs: FaqItem[] = [
  { question: "Who holds my money?", answer: "Clients fund directly with the designated broker; GTT never holds client money. GTT records investor allocations and provides reporting. Account ownership, execution arrangements, permissions and withdrawals are set out in the broker and client agreements before an investor commits." },
  { question: "How are trades executed?", answer: "The trader keeps their approved source account. GTT filters trade instructions and calculates investor allocations, then sends approved instructions to the designated broker for execution. The service guide explains how allocations and broker execution fit together." },
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
        <span className="home-kicker" style={{ color: "#0e7490" }}>For UK professional clients</span>
        <h1 id="investors-title">{copy["/professional-investors"].title}</h1>
        <p className="gtt-hero-lead">
          {copy["/professional-investors"].paragraphs[0]}
        </p>
        <div className="gtt-hero-actions">{enquireButton}</div>
        <p className="gtt-hero-help">
          <NavigationLink view="seo-professional-clients" onClick={() => onNavigate?.("seo-professional-clients")} className="gtt-text-link">What is a professional client?</NavigationLink>
        </p>
        <p className="gtt-hero-small">{seo.companyProfile.status}</p>
      </div>
    </section>

    <AudienceResources section={copy["/professional-investors"].sections[0]} id="investor-evidence-title" onNavigate={onNavigate} />

    <section className="gtt-section gtt-section-tint" aria-labelledby="journey-title">
      <div className="home-section-inner">
        <SectionHeading id="journey-title" kicker="Your journey" title="From enquiry to reporting" />
        <StepTimeline steps={journeySteps} />
        <div className="gtt-hero-actions" style={{ marginTop: 48 }}>{enquireButton}</div>
      </div>
    </section>

    <section className="gtt-section" aria-labelledby="parties-title">
      <div className="home-section-inner">
        <SectionHeading id="parties-title" kicker="Structure" title="Broker, investment manager and GTT" intro="Client capital and trade execution sit with the designated broker. Investment management is intended to sit with the regulated host, while GTT provides trader verification, trade filters, allocation technology and reporting." />
        <div className="gtt-parties">
          {parties.map(({ icon: Icon, title, sub, items }) => <div className="gtt-party" key={title}>
            <div className="gtt-party-head"><span className="gtt-card-icon" style={{ margin: 0 }}><Icon size={22} aria-hidden="true" /></span><h3>{title}</h3></div>
            <p className="gtt-party-sub">{sub}</p>
            <CheckList items={items} />
          </div>)}
        </div>
        <div className="gtt-flow" aria-hidden="true"><span>Trader’s source account</span><ArrowRight size={16} /><span>GTT filters and allocates</span><ArrowRight size={16} /><span>Execution at the broker</span></div>
        <p className="gtt-fine" style={{ marginTop: 28 }}>
          <NavigationLink view="seo-alternative-investment-platform" onClick={() => onNavigate?.("seo-alternative-investment-platform")} className="gtt-text-link">Read about our alternative investment approach</NavigationLink>, including strategy evidence, allocation controls and the proposed responsibilities.
        </p>
      </div>
    </section>

    <section className="gtt-section gtt-section-tint" aria-labelledby="risk-title">
      <div className="home-section-inner gtt-narrow">
        <SectionHeading align="left" id="risk-title" kicker="Copying and risk" title="How trades and allocations reach the broker" />
        <div className="gtt-two-col gtt-prose">
          <div>
            <h3>Sizing and checks</h3>
            <p>GTT captures source trading activity, filters instructions against the agreed risk limits and calculates the investor allocations for each approved trade. Approved instructions are then sent to the designated broker for execution. Trades outside the agreed limits may be reduced or skipped.</p>
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
        <div className="gtt-prose" style={{ marginTop: 28 }}>
          <h3>Performance fee bands</h3>
          <p>The annual management fee is a separate charge on your total capital on the platform. Performance fees are calculated on eligible trading gains before that management fee, subject to the UK risk-free-rate hurdle and your individual high-water mark. Each marginal rate applies only to the gains within its slice of return.</p>
        </div>
        <div className="gtt-table-wrap">
          <table className="gtt-table">
            <thead><tr><th scope="col">Eligible return band</th><th scope="col">Fee on that slice{includeVat ? " (incl. VAT)" : ""}</th></tr></thead>
            <tbody>
              {performanceBands.map((fee) => <tr key={fee.band}><th scope="row">{fee.band}</th><td>{includeVat ? fee.vat : fee.base}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="gtt-prose" style={{ marginTop: 28 }}>
          <h3>When performance fees become eligible</h3>
          <FaqList items={[
            {
              question: "Above the hurdle",
              answer: "The hurdle is the UK risk-free rate. Performance fees apply only to eligible trading gains above this hurdle; the management fee is charged separately on total platform capital and is not deducted when calculating those gains. Below the hurdle, no performance fee is due, while the management fee remains payable. The reference benchmark and calculation period will be agreed with the regulated host and stated in client terms.",
            },
            {
              question: "Above each client’s high-water mark",
              answer: "Your reference peak is adjusted for deposits and withdrawals. Previous losses must be recovered before new performance fees become eligible. A recovery to your previous peak does not itself earn a performance fee. Unrecovered losses carry forward across fee periods, so you do not pay a performance fee twice on the same gains.",
            },
            {
              id: "investor-fee-calculator",
              question: "Explore an annual investment fee illustration",
              answer: <FeeCalculator audience="investor" />,
            },
          ]} />
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
      title="Open to client discussions"
      text="We welcome conversations with prospective UK professional clients about their investment interests and the proposed service."
      small="The investment platform is in development and is not yet available."
    >
      {enquireButton}
    </CtaBand>
    <Footer onNavigate={onNavigate} />
  </PageShell>;
}
