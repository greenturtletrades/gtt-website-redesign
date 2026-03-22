import { useRef } from "react";
import { Hero } from "./Hero";
import { ProductSummary } from "./ProductSummary";
import { PlatformPreview } from "./PlatformPreview";
import { ValuePropositions } from "./ValuePropositions";
import { Footer } from "./Footer";
import { TurtleAnalyticsFeature } from "./TurtleAnalyticsFeature";
import { ScrollProgress } from "./ScrollProgress";
import { WaitingListSignup } from "./WaitingListSignup";

interface LandingPageProps {
  onTraderClick: () => void;
  onApplyClick: () => void;
  onNavigateLegal?: (page: "terms" | "privacy" | "risk-disclosure" | "contact") => void;
}

export function LandingPage({
  onTraderClick,
  onApplyClick,
  onNavigateLegal,
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
      <TurtleAnalyticsFeature />
      <ValuePropositions />
      <div ref={waitingListRef}>
        <WaitingListSignup />
      </div>
      <Footer onNavigateLegal={onNavigateLegal} />
    </>
  );
}
