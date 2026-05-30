import { getSeoContentPage } from "./content";
import { SITE_URL, getCanonicalUrl, type ViewType } from "./routes";

export function buildStructuredData(view: ViewType) {
  const contentPage = getSeoContentPage(view);
  if (contentPage) {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          name: contentPage.title,
          url: getCanonicalUrl(view),
          description: contentPage.description,
          isPartOf: {
            "@type": "WebSite",
            name: "Green Turtle Trades",
            url: SITE_URL,
          },
          about: contentPage.sections.map((section) => ({
            "@type": "Thing",
            name: section.title,
          })),
        },
        {
          "@type": "FAQPage",
          mainEntity: contentPage.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        },
      ],
    };
  }

  if (view === "landing") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: "Green Turtle Trades",
          url: SITE_URL,
          email: "contact@greenturtletraders.co.uk",
          address: {
            "@type": "PostalAddress",
            streetAddress: "5 South Charlotte Street",
            addressLocality: "Edinburgh",
            postalCode: "EH2 4AN",
            addressCountry: "GB",
          },
        },
        {
          "@type": "WebSite",
          name: "Green Turtle Trades",
          url: SITE_URL,
          description:
            "A verified trader platform with trading analytics, a trading journal, investor capital access, and a public traders leaderboard.",
        },
        {
          "@type": "WebPage",
          name: "Green Turtle Trades",
          url: getCanonicalUrl(view),
          description:
            "Green Turtle Trades connects verified traders with investor capital and provides trading analytics, trade journal tools, and transparent trader performance data.",
          about: [
            {
              "@type": "Thing",
              name: "Verified traders",
            },
            {
              "@type": "Thing",
              name: "Trading analytics",
            },
            {
              "@type": "Thing",
              name: "Trading journal",
            },
            {
              "@type": "Thing",
              name: "Investor capital",
            },
          ],
        },
      ],
    };
  }

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
