import { useRef } from "react";
import { Hero } from "./Hero";
import { AppWalkthrough } from "./AppWalkthrough";
import { HomeNextSteps } from "./HomeNextSteps";
import { TurtleAnalyticsFeature } from "./TurtleAnalyticsFeature";
import { ValuePropositions } from "./ValuePropositions";
import { Footer } from "./Footer";
import { ScrollProgress } from "./ScrollProgress";
import { WaitingListSignup } from "./WaitingListSignup";
import type { ViewType } from "../../seo/routes";
import "../../styles/home-brand.css";

interface LandingPageProps {
  onTraderClick: () => void;
  onApplyClick: () => void;
  onNavigate?: (page: ViewType) => void;
  mlEnabled?: boolean;
}

export function LandingPage({
  onTraderClick,
  onApplyClick,
  onNavigate,
  mlEnabled = false,
}: LandingPageProps) {
  const waitingListRef = useRef<HTMLDivElement>(null);

  const scrollToWaitingList = () => {
    waitingListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="home-experience">
      <ScrollProgress />
      <Hero
        onTraderClick={onTraderClick}
        onApplyClick={onApplyClick}
        onScrollToWaitingList={scrollToWaitingList}
      />
      <AppWalkthrough onNavigate={onNavigate} />
      <HomeNextSteps onApplyClick={onApplyClick} onInvestorClick={scrollToWaitingList} />
      <TurtleAnalyticsFeature mlEnabled={mlEnabled} onExplore={() => onNavigate?.("turtle-analytics")} />
      <div className="home-trust-signup">
        <div className="home-section-inner home-trust-layout">
          <ValuePropositions />
          <div ref={waitingListRef} className="home-waitlist-anchor">
            <WaitingListSignup />
          </div>
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
