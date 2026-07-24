import { getSeoContentPage } from "./content";
import { SITE_URL, getCanonicalUrl, type ViewType } from "./routes";

const organizationStructuredData = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Green Turtle Trades",
  alternateName: [
    "Green Turtle Traders",
    "Green Turtle Trades Limited",
    "Green Turtle Traders UK",
    "Green Turtle Trading Platform",
    "Turtle Analytics",
  ],
  legalName: "Green Turtle Trades Limited",
  identifier: "SC878660",
  url: SITE_URL,
  mainEntityOfPage: `${SITE_URL}/green-turtle-trades`,
  logo: `${SITE_URL}/favicon-v2.png`,
  email: "contact@greenturtletraders.co.uk",
  description:
    "Green Turtle Trades is a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited, company number SC878660.",
  sameAs: [
    "https://www.instagram.com/greenturtletrades/",
    "https://www.youtube.com/@GreenTurtleTrades",
    "https://find-and-update.company-information.service.gov.uk/company/SC878660",
  ],
  knowsAbout: [
    "Trading analytics",
    "Verified traders",
    "Trading journal",
    "Trader leaderboard",
    "Trading risk management",
    "Trading performance analysis",
    "Trader-backed investing",
    "Fintech investment platforms",
    "Copy trading platforms",
    "Trader marketplaces",
    "Prop firm alternatives",
  ],
};

const websiteStructuredData = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Green Turtle Trades",
  alternateName: ["Green Turtle Traders", "Green Turtle Trading Platform"],
  url: SITE_URL,
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
  description:
    "A verified trader platform with trading analytics, a trading journal, investor capital access, and a public traders leaderboard.",
  about: {
    "@id": `${SITE_URL}/#organization`,
  },
  hasPart: [
    `${SITE_URL}/about`,
    `${SITE_URL}/green-turtle-trades`,
    `${SITE_URL}/trading-analytics`,
    `${SITE_URL}/trading-journal`,
    `${SITE_URL}/verified-traders`,
    `${SITE_URL}/turtle-analytics`,
    `${SITE_URL}/traders-leaderboard`,
  ],
};

export function buildStructuredData(view: ViewType) {
  const contentPage = getSeoContentPage(view);
  if (contentPage) {
    return {
      "@context": "https://schema.org",
      "@graph": [
        organizationStructuredData,
        websiteStructuredData,
        {
          "@type": "WebPage",
          name: contentPage.title,
          url: getCanonicalUrl(view),
          description: contentPage.description,
          mainEntity:
            view === "seo-green-turtle-trades"
              ? {
                  "@id": `${SITE_URL}/#organization`,
                }
              : undefined,
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          publisher: {
            "@id": `${SITE_URL}/#organization`,
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

  if (view === "about") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        organizationStructuredData,
        websiteStructuredData,
        {
          "@type": "AboutPage",
          name: "About Green Turtle Trades",
          headline: "Building the UK's most transparent platform for trader-backed investing",
          url: getCanonicalUrl(view),
          description:
            "About Green Turtle Trades, a UK trading analytics and trader-backed investing platform founded by four Edinburgh university students to make trader performance, risk, and investing decisions more transparent.",
          mainEntity: {
            "@id": `${SITE_URL}/#organization`,
          },
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: `${SITE_URL}/favicon-v2.png`,
          },
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          publisher: {
            "@id": `${SITE_URL}/#organization`,
          },
          about: [
            {
              "@type": "Thing",
              name: "Trader-backed investing platform",
            },
            {
              "@type": "Thing",
              name: "Fintech investment platforms",
            },
            {
              "@type": "Thing",
              name: "Copy trading platforms",
            },
            {
              "@type": "Thing",
              name: "Trader marketplaces",
            },
            {
              "@type": "Thing",
              name: "Prop firm alternatives",
            },
            {
              "@type": "Thing",
              name: "Trading analytics",
            },
            {
              "@type": "Thing",
              name: "Trader performance transparency",
            },
            {
              "@type": "Thing",
              name: "Trading journal workflows",
            },
            {
              "@type": "Thing",
              name: "Trading scam prevention",
            },
            {
              "@type": "Thing",
              name: "Trader-backed investing",
            },
            {
              "@type": "Thing",
              name: "Edinburgh startup",
            },
          ],
        },
      ],
    };
  }

  if (view === "landing") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        organizationStructuredData,
        websiteStructuredData,
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
      "@graph": [
        organizationStructuredData,
        websiteStructuredData,
        {
          "@type": "WebPage",
          name: "Traders Leaderboard",
          url: getCanonicalUrl(view),
          description:
            "A public traders leaderboard from Green Turtle Trades showing verified trading performance, win rate, expectancy, risk control, and trade history.",
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          publisher: {
            "@id": `${SITE_URL}/#organization`,
          },
          about: {
            "@type": "Thing",
            name: "Verified trading performance leaderboard",
          },
        },
      ],
    };
  }

  if (view === "turtle-analytics") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        organizationStructuredData,
        websiteStructuredData,
        {
          "@type": "SoftwareApplication",
          name: "Turtle Analytics",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          url: getCanonicalUrl(view),
          description:
            "A trading analytics and trading journal platform from Green Turtle Trades for reviewing trade history, expectancy, risk control, and performance insights.",
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          publisher: {
            "@id": `${SITE_URL}/#organization`,
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
        },
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [organizationStructuredData, websiteStructuredData],
  };
}
