import type { ViewType } from "../../seo/routes";
import { isInvestorPageLive } from "../../featureFlags";
import { Footer } from "./Footer";
import { FaqList, PageShell, type FaqItem } from "./PageBlocks";

type Navigate = (view: ViewType) => void;

const generalFaqs: FaqItem[] = [
  { question: "What is Green Turtle Trades?", answer: "Green Turtle Trades is developing a platform that verifies independent traders and, through a regulated host firm, copies their trades into accounts managed for professional clients. We also run Turtle Analytics, a trading journal and analytics tool, and a university investment competition." },
  { question: "Is the investment service live?", answer: "Not yet. As of October 2026 the service is in development with a regulated host firm. We are reviewing trader applications and taking enquiries from professional investors." },
  { question: "Is Green Turtle Trades regulated?", answer: "The investment service will be provided under a regulated arrangement with an FCA-authorised host firm, which is responsible for client categorisation, onboarding and the investment mandate. GTT provides the trader verification and copying technology." },
];

const traderFaqs: FaqItem[] = [
  { question: "Who can apply as a trader?", answer: "Independent traders with around 12 months of verifiable live history, an explainable strategy and consistent risk control. Demo and competition records are accepted but reviewed separately." },
  { question: "Do I need to move my account?", answer: "No. You keep trading from your own broker account. Any connection to it is authorised by you and read-only." },
  { question: "Will you ask for my password?", answer: "Never. We don't ask for account passwords, investor passwords or API keys." },
  { question: "How long does review take?", answer: "We aim to contact you within 10 working days if we'd like to discuss your strategy. Applying does not guarantee selection, a contract or investor capital." },
];

const investorFaqs: FaqItem[] = [
  { question: "Who can invest?", answer: "Only professional clients, as categorised by the regulated firm. Filling in our enquiry form does not establish eligibility." },
  { question: "Where is my money held?", answer: "In an account in your name at a broker or custodian. Neither GTT nor the traders can withdraw it." },
  { question: "What are the fees?", answer: "The proposed terms are a 1.25% annual management fee and a 20% performance fee above a high-water mark, plus VAT, with a minimum of £10,000 per trader. These terms are subject to agreement with the host firm." },
];

export function FaqsPage({ onNavigate }: { onNavigate?: Navigate }) {
  return <PageShell>
    <section className="gtt-hero gtt-hero-left" style={{ paddingBottom: 56 }} aria-labelledby="faqs-title">
      <div className="home-section-inner gtt-narrow">
        <span className="home-kicker">Help</span>
        <h1 id="faqs-title">Frequently asked questions</h1>
        <p className="gtt-hero-lead" style={{ marginBottom: 0 }}>
          Can't find what you need? <button type="button" className="gtt-text-link" style={{ fontSize: "inherit" }} onClick={() => onNavigate?.("contact")}>Contact us</button>.
        </p>
      </div>
    </section>
    <section className="gtt-section" style={{ paddingTop: 56 }}>
      <div className="home-section-inner gtt-narrow">
        <div className="gtt-faq-group"><h2>General</h2><FaqList items={generalFaqs} /></div>
        <div className="gtt-faq-group gtt-tone-trader"><h2>For traders</h2><FaqList items={traderFaqs} /></div>
        {isInvestorPageLive && <div className="gtt-faq-group gtt-tone-investor"><h2>For professional investors</h2><FaqList items={investorFaqs} /></div>}
      </div>
    </section>
    <Footer onNavigate={onNavigate} />
  </PageShell>;
}
