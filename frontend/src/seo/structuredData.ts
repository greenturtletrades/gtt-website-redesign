import { getSeoContentPage } from "./content";
import { SITE_URL, getCanonicalUrl, type ViewType } from "./routes";

const COMPETITION_APP_URL = "https://comp.turtletrades.co.uk";

const organizationStructuredData = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Green Turtle Trades",
  alternateName: [
    "Green Turtle Traders",
    "Green Turtle Trade",
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
  foundingDate: "2026-02-11",
  foundingLocation: {
    "@type": "Place",
    name: "Edinburgh, Scotland",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Edinburgh",
    addressRegion: "Scotland",
    addressCountry: "GB",
  },
  description:
    "Green Turtle Trades is an Edinburgh-based UK fintech company building trading analytics, trader journal tools, trader-backed investing workflows, and a Scottish university investment competition.",
  sameAs: [
    COMPETITION_APP_URL,
    "https://www.linkedin.com/company/green-turtle-trade/",
    "https://www.instagram.com/greenturtletrades_/",
    "https://www.tiktok.com/@greenturtletrades",
    "https://x.com/GreenTurtleT",
    "https://www.youtube.com/@GreenTurtleTrades",
    "https://find-and-update.company-information.service.gov.uk/company/SC878660",
  ],
  knowsAbout: [
    "Trading analytics",
    "Verified traders",
    "Trading journal",
    "University investment competition",
    "Student trading competition",
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
    "A verified trader platform with trading analytics, a trading journal, investor capital access, and a public university competition leaderboard.",
  about: {
    "@id": `${SITE_URL}/#organization`,
  },
  hasPart: [
    `${SITE_URL}/about`,
    `${SITE_URL}/green-turtle-trades`,
    `${SITE_URL}/trading-journal`,
    `${SITE_URL}/turtle-analytics`,
    `${SITE_URL}/trading-analytics`,
    `${SITE_URL}/university-competition`,
    COMPETITION_APP_URL,
    `${SITE_URL}/verified-traders`,
    `${SITE_URL}/methodology`,
    `${SITE_URL}/prop-firm-alternative`,
    `${SITE_URL}/trading-performance-tracker`,
    `${SITE_URL}/trader-marketplace`,
  ],
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const competitionAppStructuredData = {
  "@type": "WebApplication",
  "@id": `${COMPETITION_APP_URL}/#webapp`,
  name: "Green Turtle Trades University Competition App",
  alternateName: "Turtle Trades Competition",
  url: COMPETITION_APP_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  provider: {
    "@id": `${SITE_URL}/#organization`,
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GBP",
  },
  description:
    "The secure Green Turtle Trades university competition app where Scottish university competitors log in, trade virtual market capital, follow traders, review competition analytics, and manage competition accounts.",
  isPartOf: {
    "@id": `${SITE_URL}/#website`,
  },
};

function buildBreadcrumbStructuredData(view: ViewType) {
  const url = getCanonicalUrl(view);
  const contentPage = getSeoContentPage(view);
  const pageName =
    contentPage?.title ||
    (view === "landing"
      ? "Home"
      : view
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "));

  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Green Turtle Trades",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pageName,
        item: url,
      },
    ],
  };
}

function buildOrganizationProfilePageStructuredData(view: ViewType) {
  return {
    "@type": "ProfilePage",
    name: "Green Turtle Trades official social profiles",
    url: getCanonicalUrl(view),
    mainEntity: {
      "@id": `${SITE_URL}/#organization`,
      "@type": "Organization",
      name: "Green Turtle Trades",
      alternateName: ["Green Turtle Traders", "Turtle Analytics"],
      url: SITE_URL,
      sameAs: organizationStructuredData.sameAs,
      image: `${SITE_URL}/favicon-v2.png`,
      description:
        "Official Green Turtle Trades profile connecting the website with LinkedIn, Instagram, TikTok, X, YouTube, and Companies House.",
    },
  };
}

export function buildStructuredData(view: ViewType) {
  const contentPage = getSeoContentPage(view);
  if (contentPage) {
    const extraGraph =
      view === "seo-green-turtle-trades"
        ? [buildOrganizationProfilePageStructuredData(view)]
        : [];

    return {
      "@context": "https://schema.org",
      "@graph": [
        organizationStructuredData,
        websiteStructuredData,
        competitionAppStructuredData,
        buildBreadcrumbStructuredData(view),
        {
          "@type": "WebPage",
          name: contentPage.title,
          url: getCanonicalUrl(view),
          description: contentPage.description,
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: `${SITE_URL}/favicon-v2.png`,
          },
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
        ...extraGraph,
      ],
    };
  }

  if (view === "about") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        organizationStructuredData,
        websiteStructuredData,
        competitionAppStructuredData,
        buildBreadcrumbStructuredData(view),
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
        competitionAppStructuredData,
        buildBreadcrumbStructuredData(view),
        {
          "@type": "WebPage",
          name: "Green Turtle Trades",
          url: getCanonicalUrl(view),
          description:
            "Green Turtle Trades connects verified traders with investor capital and provides trading analytics, trade journal tools, transparent trader performance data, and a Scottish university investment competition.",
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: `${SITE_URL}/favicon-v2.png`,
          },
          mainEntity: {
            "@id": `${SITE_URL}/#organization`,
          },
          significantLink: [
            `${SITE_URL}/green-turtle-trades`,
            `${SITE_URL}/trading-journal`,
            `${SITE_URL}/turtle-analytics`,
            `${SITE_URL}/university-competition`,
            COMPETITION_APP_URL,
            `${SITE_URL}/methodology`,
            `${SITE_URL}/trading-performance-tracker`,
            `${SITE_URL}/prop-firm-alternative`,
          ],
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
            {
              "@type": "Thing",
              name: "University investment competition",
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
        competitionAppStructuredData,
        buildBreadcrumbStructuredData(view),
        {
          "@type": "WebPage",
          name: "University Investment Competition Leaderboard Scotland",
          headline: "Scotland's next generation of investors, ranked live.",
          alternativeHeadline: "Live Scottish university investment competition leaderboard",
          url: getCanonicalUrl(view),
          relatedLink: COMPETITION_APP_URL,
          description:
            "Scotland's next generation of investors, ranked live. A public university investment competition leaderboard from Green Turtle Trades showing Scottish university rankings, student trader scores, returns, win rate, risk, backers, and competition activity.",
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
              name: "University investment competition leaderboard",
            },
            {
              "@type": "Thing",
              name: "Scottish student investing competition",
            },
            {
              "@type": "Thing",
              name: "Risk-free virtual trading competition",
            },
          ],
          mainEntity: {
            "@type": "Event",
            name: "Green Turtle Trades University Investment Competition",
            eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
            eventStatus: "https://schema.org/EventScheduled",
            location: {
              "@type": "VirtualLocation",
              url: COMPETITION_APP_URL,
            },
            organizer: {
              "@id": `${SITE_URL}/#organization`,
            },
            description:
              "Scotland's next generation of investors, ranked live through a Scottish university investment competition where students use virtual market capital and a separate trader-backing account to learn practical investing, risk control, and portfolio discipline.",
            audience: {
              "@type": "Audience",
              audienceType: "Scottish university students",
            },
            sameAs: COMPETITION_APP_URL,
            workFeatured: {
              "@id": `${COMPETITION_APP_URL}/#webapp`,
            },
          },
        },
        {
          "@type": "ItemList",
          name: "University competition leaderboard",
          description:
            "Live public leaderboard covering top individual student competitors and university rankings from the Green Turtle Trades competition engine.",
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          url: getCanonicalUrl(view),
          sameAs: COMPETITION_APP_URL,
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
        competitionAppStructuredData,
        buildBreadcrumbStructuredData(view),
        {
          "@type": "SoftwareApplication",
          name: "Turtle Analytics",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          url: getCanonicalUrl(view),
          description:
            "A trading journal and trading analytics platform from Green Turtle Trades for reviewing imported trade history, expectancy, drawdown, risk control, account activity, and trader performance.",
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          publisher: {
            "@id": `${SITE_URL}/#organization`,
          },
          featureList: [
            "Trading journal",
            "Trading analytics",
            "MT4 and MT5 trade history analysis",
            "Trading 212 and CSV import workflows",
            "Expectancy and profit factor review",
            "Drawdown and risk-per-trade analysis",
            "Trade notes and journal records",
            "Account ledger and stats cards",
            "Private analytics with optional public performance summaries",
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
