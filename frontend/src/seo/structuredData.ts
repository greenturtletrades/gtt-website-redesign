import { getSeoContentPage } from "./content";
import { SITE_URL, getCanonicalUrl, type ViewType } from "./routes";

const organizationStructuredData = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Green Turtle Trades",
  legalName: "Green Turtle Trades Limited",
  identifier: "SC878660",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon-v2.png`,
  email: "contact@greenturtletraders.co.uk",
  description:
    "Green Turtle Trades is a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited, company number SC878660.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "5 South Charlotte Street",
    addressLocality: "Edinburgh",
    postalCode: "EH2 4AN",
    addressCountry: "GB",
  },
  sameAs: [
    "https://www.instagram.com/greenturtletrades/",
    "https://find-and-update.company-information.service.gov.uk/company/SC878660",
  ],
  knowsAbout: [
    "Trading analytics",
    "Verified traders",
    "Trading journal",
    "Trader leaderboard",
    "Trading risk management",
    "Trading performance analysis",
  ],
};

const websiteStructuredData = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Green Turtle Trades",
  url: SITE_URL,
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
  description:
    "A verified trader platform with trading analytics, a trading journal, investor capital access, and a public traders leaderboard.",
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
