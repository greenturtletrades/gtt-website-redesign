import { ArrowRight } from "lucide-react";
import type { ViewType } from "../../seo/routes";
import { isInvestorPageLive } from "../../featureFlags";

export function Hero({ onNavigate }: { onNavigate?: (view: ViewType) => void }) {
  return (
    <section className="gtt-hero gtt-hero-centre" aria-labelledby="home-hero-title">
      <div className="home-section-inner">
        <span className="home-kicker">Green Turtle Trades</span>
        <h1 id="home-hero-title">Verified trading strategies for professional investors</h1>
        <p className="gtt-hero-lead">
          Green Turtle Trades is developing a platform that connects independently verified traders with professional
          investors. Traders keep trading from their own broker accounts, and their trades are copied within agreed
          limits into accounts managed for professional clients.
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
        <p className="gtt-hero-small">Investment service for professional clients only. In development.</p>
      </div>
    </section>
  );
}
