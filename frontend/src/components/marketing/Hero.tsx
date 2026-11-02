import { ArrowRight } from "lucide-react";
import type { ViewType } from "../../seo/routes";
import { isInvestorPageLive } from "../../featureFlags";
import { NavigationLink } from "../../seo/NavigationLink";
import seo from "../../../seo.config.json";
import copy from "../../../page-copy.json";

export function Hero({ onNavigate }: { onNavigate?: (view: ViewType) => void }) {
  return (
    <section className="gtt-hero gtt-hero-centre" aria-labelledby="home-hero-title">
      <div className="home-section-inner">
        <span className="home-kicker">Green Turtle Trades</span>
        <h1 id="home-hero-title">{copy["/"].title}</h1>
        <p className="gtt-hero-lead">
          {copy["/"].paragraphs[0]}
        </p>
        <div className="gtt-hero-actions">
          {isInvestorPageLive && (
            <NavigationLink view="professional-investors" className="home-brand-button gtt-button-investor" onClick={onNavigate ? () => onNavigate("professional-investors") : undefined}>
              For Investors<ArrowRight size={18} aria-hidden="true" />
            </NavigationLink>
          )}
          <NavigationLink view="traders" className="home-brand-button home-brand-button-secondary" onClick={onNavigate ? () => onNavigate("traders") : undefined}>
            For Traders<ArrowRight size={18} aria-hidden="true" />
          </NavigationLink>
        </div>
        <p className="gtt-hero-small">{seo.companyProfile.status}</p>
        <p className="gtt-hero-small">
          <NavigationLink view="seo-alternative-investment-platform" onClick={onNavigate ? () => onNavigate("seo-alternative-investment-platform") : undefined} className="gtt-text-link">
            Our alternative investment approach <ArrowRight size={16} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle" }} />
          </NavigationLink>
        </p>
        <p className="gtt-hero-small">
          <NavigationLink view="seo-copy-trading-platform" onClick={onNavigate ? () => onNavigate("seo-copy-trading-platform") : undefined} className="gtt-text-link">
            How our copy trading platform works <ArrowRight size={16} aria-hidden="true" style={{ display: "inline", verticalAlign: "middle" }} />
          </NavigationLink>
        </p>
      </div>
    </section>
  );
}
