import { Hero } from "./Hero";
import { HomeEvidence, HowItWorks, RouteCards, StatusContact } from "./HomeSections";
import { TurtleAnalyticsFeature } from "./TurtleAnalyticsFeature";
import { Footer } from "./Footer";
import { ScrollProgress } from "./ScrollProgress";
import { PageShell } from "./PageBlocks";
import type { ViewType } from "../../seo/routes";

interface LandingPageProps {
  onNavigate?: (page: ViewType) => void;
  mlEnabled?: boolean;
}

export function LandingPage({
  onNavigate,
  mlEnabled = false,
}: LandingPageProps) {
  return (
    <PageShell>
      <ScrollProgress />
      <Hero onNavigate={onNavigate} />
      <HowItWorks />
      <RouteCards onNavigate={onNavigate} />
      <HomeEvidence onNavigate={onNavigate} />
      <TurtleAnalyticsFeature mlEnabled={mlEnabled} onExplore={() => onNavigate?.("turtle-analytics")} />
      <StatusContact onNavigate={onNavigate} />
      <Footer onNavigate={onNavigate} />
    </PageShell>
  );
}
