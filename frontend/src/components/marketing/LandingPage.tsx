import { useRef } from "react";
import { Hero } from "./Hero";
import { ProductSummary } from "./ProductSummary";
import { PlatformPreview } from "./PlatformPreview";
import { ValuePropositions } from "./ValuePropositions";
import { Footer } from "./Footer";
import { TurtleAnalyticsFeature } from "./TurtleAnalyticsFeature";
import { ScrollProgress } from "./ScrollProgress";
import { WaitingListSignup } from "./WaitingListSignup";
import type { ViewType } from "../../seo/routes";

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
    <>
      <ScrollProgress />
      <Hero
        onTraderClick={onTraderClick}
        onApplyClick={onApplyClick}
        onScrollToWaitingList={scrollToWaitingList}
      />
      <ProductSummary />
      <PlatformPreview />
      <TurtleAnalyticsFeature mlEnabled={mlEnabled} />
      <ValuePropositions />
      <div ref={waitingListRef}>
        <WaitingListSignup />
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );
}
