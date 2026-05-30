import { SITE_URL, getCanonicalUrl, type ViewType } from "./routes";

export function buildStructuredData(view: ViewType) {
  if (view === "turtle-traders") {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Traders Leaderboard",
      url: getCanonicalUrl(view),
      description:
        "A public traders leaderboard from Green Turtle Trades showing verified trading performance, win rate, expectancy, risk control, and trade history.",
      isPartOf: {
        "@type": "WebSite",
        name: "Green Turtle Trades",
        url: SITE_URL,
      },
      about: {
        "@type": "Thing",
        name: "Verified trading performance leaderboard",
      },
    };
  }

  if (view === "turtle-analytics") {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Turtle Analytics",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: getCanonicalUrl(view),
      description:
        "A trading analytics and trading journal platform from Green Turtle Trades for reviewing trade history, expectancy, risk control, and performance insights.",
      isPartOf: {
        "@type": "WebSite",
        name: "Green Turtle Trades",
        url: SITE_URL,
      },
      featureList: [
        "Trading analytics",
        "Trading journal",
        "Trade history analysis",
        "Risk control insights",
        "Expectancy analysis",
        "Performance reporting",
      ],
      offers: {
        "@type": "Offer",
        priceCurrency: "GBP",
        availability: "https://schema.org/InStock",
      },
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Green Turtle Trades",
    url: SITE_URL,
  };
}
