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

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Green Turtle Trades",
    url: SITE_URL,
  };
}
