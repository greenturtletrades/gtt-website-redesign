import { Hero } from "./Hero";
import { AppWalkthrough } from "./AppWalkthrough";
import { HomeNextSteps } from "./HomeNextSteps";
import { TurtleAnalyticsFeature } from "./TurtleAnalyticsFeature";
import { ValuePropositions } from "./ValuePropositions";
import { Footer } from "./Footer";
import { ScrollProgress } from "./ScrollProgress";
import type { ViewType } from "../../seo/routes";
import "../../styles/home-brand.css";

interface LandingPageProps {
  onNavigate?: (page: ViewType) => void;
  mlEnabled?: boolean;
}

export function LandingPage({
  onNavigate,
  mlEnabled = false,
}: LandingPageProps) {
  return (
    <div className="home-experience">
      <ScrollProgress />
      <Hero />
      <AppWalkthrough onNavigate={onNavigate} />
      <HomeNextSteps />
      <TurtleAnalyticsFeature mlEnabled={mlEnabled} onExplore={() => onNavigate?.("turtle-analytics")} />
      <div className="home-trust-signup">
        <div className="home-section-inner">
          <ValuePropositions />
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
