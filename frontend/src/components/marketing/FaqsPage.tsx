import type { ViewType } from "../../seo/routes";
import { isInvestorPageLive } from "../../featureFlags";
import seo from "../../../seo.config.json";
import { Footer } from "./Footer";
import { FaqList, PageShell, type FaqItem } from "./PageBlocks";

type Navigate = (view: ViewType) => void;

const generalFaqs: FaqItem[] = [
  { question: "What is Green Turtle Trades?", answer: seo.organization.description },
  { question: "Is the investment platform available?", answer: seo.companyProfile.status },
  { question: "Who would oversee investment management?", answer: "The proposed model places client assessment, investment management and oversight with an FCA-authorised host firm. GTT provides trader verification, trade filtering, allocation calculations and reporting technology. The investment platform is in development and is not yet available; final responsibilities would be documented before launch." },
];

const traderFaqs: FaqItem[] = [
  { question: "Who can apply as a trader?", answer: "Independent traders with around 12 months of verifiable live history, an explainable strategy and consistent risk control. Demo and competition records are accepted but reviewed separately." },
  { question: "Do I need to move my account?", answer: "You can retain an approved existing MT4 or MT5 source broker account, subject to access permissions and compatibility. GTT captures source activity, filters trade instructions and calculates investor allocations for separate execution at the designated broker." },
  { question: "Will you ask for my password?", answer: "Never. We don't ask for account passwords, investor passwords or API keys." },
  { question: "How long does review take?", answer: "We aim to contact you within 10 working days if we'd like to discuss your strategy. Applying does not guarantee selection, a contract or investor capital." },
];

const investorFaqs: FaqItem[] = [
  { question: "Who can invest?", answer: "Only professional clients, as categorised by the regulated firm. Filling in our enquiry form does not establish eligibility." },
  { question: "Where is my money held?", answer: "Clients fund directly with the designated broker. GTT never holds client money. Investor allocations, execution arrangements, account permissions and withdrawals follow the agreed broker and client terms, explained before an investor commits." },
  { question: "What are the fees?", answer: "The Professional Investors page sets out the proposed management fee, performance-fee bands, hurdle, high-water mark and minimum allocation. Final terms are subject to agreement with the host firm and will be documented before launch." },
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
