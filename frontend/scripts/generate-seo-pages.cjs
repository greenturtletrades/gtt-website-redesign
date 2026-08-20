const fs = require("fs");
const path = require("path");

const buildDir = path.resolve(__dirname, "..", "build");
const indexPath = path.join(buildDir, "index.html");
const siteUrl = "https://greenturtletraders.co.uk";
const competitionAppUrl = "https://comp.turtletrades.co.uk";
const socialImageUrl = `${siteUrl}/favicon-v2.png`;

const organizationStructuredData = {
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
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
  url: siteUrl,
  logo: `${siteUrl}/favicon-v2.png`,
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
    competitionAppUrl,
    "https://www.linkedin.com/company/green-turtle-trade/",
    "https://www.instagram.com/greenturtletrades_/",
    "https://www.tiktok.com/@greenturtletrades",
    "https://x.com/GreenTurtleT",
    "https://www.youtube.com/@GreenTurtleTrades",
    "https://find-and-update.company-information.service.gov.uk/company/SC878660",
  ],
  knowsAbout: [
    "Trader-backed investing",
    "Trading analytics",
    "Verified trader performance",
    "Fintech investment platforms",
    "Copy trading platforms",
    "Trader marketplaces",
    "Prop firm alternatives",
  ],
};

const websiteStructuredData = {
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: "Green Turtle Trades",
  alternateName: ["Green Turtle Traders", "Green Turtle Trading Platform"],
  url: siteUrl,
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
  hasPart: [
    `${siteUrl}/about`,
    `${siteUrl}/green-turtle-trades`,
    `${siteUrl}/trading-journal`,
    `${siteUrl}/turtle-analytics`,
    `${siteUrl}/trading-analytics`,
    `${siteUrl}/trading-expectancy`,
    `${siteUrl}/trading-drawdown`,
    `${siteUrl}/profit-factor-trading`,
    `${siteUrl}/risk-reward-ratio-trading`,
    `${siteUrl}/trader-verification-guide`,
    `${siteUrl}/university-competition`,
    competitionAppUrl,
    `${siteUrl}/verified-traders`,
    `${siteUrl}/methodology`,
    `${siteUrl}/prop-firm-alternative`,
    `${siteUrl}/trading-performance-tracker`,
    `${siteUrl}/trader-marketplace`,
  ],
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const competitionAppStructuredData = {
  "@type": "WebApplication",
  "@id": `${competitionAppUrl}/#webapp`,
  name: "Green Turtle Trades University Competition App",
  alternateName: "Turtle Trades Competition",
  url: competitionAppUrl,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  provider: {
    "@id": `${siteUrl}/#organization`,
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GBP",
  },
  description:
    "The secure Green Turtle Trades university competition app where Scottish university competitors log in, trade virtual market capital, follow traders, review competition analytics, and manage competition accounts.",
  isPartOf: {
    "@id": `${siteUrl}/#website`,
  },
};

function organizationProfilePage(canonical) {
  return {
    "@type": "ProfilePage",
    name: "Green Turtle Trades official social profiles",
    url: canonical,
    mainEntity: {
      "@id": `${siteUrl}/#organization`,
      "@type": "Organization",
      name: "Green Turtle Trades",
      alternateName: ["Green Turtle Traders", "Turtle Analytics"],
      url: siteUrl,
      sameAs: organizationStructuredData.sameAs,
      image: socialImageUrl,
      description:
        "Official Green Turtle Trades profile connecting the website with LinkedIn, Instagram, TikTok, X, YouTube, and Companies House.",
    },
  };
}

function page({
  route,
  canonicalRoute = route,
  title,
  description,
  keywords,
  h1,
  paragraphs,
  topics = [],
  schemaType = "WebPage",
  headline = h1,
  extraGraph = [],
}) {
  const canonical = `${siteUrl}${canonicalRoute}`;
  const breadcrumbStructuredData = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Green Turtle Trades",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: h1,
        item: canonical,
      },
    ],
  };
  return {
    route,
    outputPath: path.join(buildDir, route.replace(/^\//, ""), "index.html"),
    title,
    description,
    keywords,
    canonical,
    ogTitle: title,
    ogDescription: description,
    fallback: buildFallback({ h1, paragraphs }),
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          ...organizationStructuredData,
          mainEntityOfPage: canonical,
        },
        websiteStructuredData,
        competitionAppStructuredData,
        breadcrumbStructuredData,
        {
          "@type": schemaType,
          name: h1,
          headline,
          url: canonical,
          description,
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: socialImageUrl,
          },
          mainEntity:
            schemaType === "AboutPage"
              ? {
                  "@id": `${siteUrl}/#organization`,
                }
              : undefined,
          isPartOf: {
            "@id": `${siteUrl}/#website`,
          },
          publisher: {
            "@id": `${siteUrl}/#organization`,
          },
          about: topics.map((topic) => ({
            "@type": "Thing",
            name: topic,
          })),
        },
        ...extraGraph,
      ],
    },
  };
}

function buildFallback({ h1, paragraphs }) {
  return `
        <main class="seo-fallback">
          <section>
            <h1>${escapeHtml(h1)}</h1>
            ${paragraphs
              .map(
                (paragraph) => `<p>
              ${escapeHtml(paragraph)}
            </p>`,
              )
              .join("\n            ")}
          </section>
          <section>
            <h2>Key Green Turtle Trades pages</h2>
            <ul>
              <li><a href="/">Green Turtle Trades homepage</a></li>
              <li><a href="/about">About Green Turtle Trades</a></li>
              <li><a href="/trading-journal">Trading Journal</a></li>
              <li><a href="/turtle-analytics">Turtle Analytics</a></li>
              <li><a href="/trading-analytics">Trading Analytics</a></li>
              <li><a href="/trading-expectancy">Trading Expectancy</a></li>
              <li><a href="/trading-drawdown">Trading Drawdown</a></li>
              <li><a href="/profit-factor-trading">Profit Factor in Trading</a></li>
              <li><a href="/risk-reward-ratio-trading">Risk/Reward Ratio in Trading</a></li>
              <li><a href="/trader-verification-guide">Trader Verification Guide</a></li>
              <li><a href="/university-competition">University Competition</a></li>
              <li><a href="/verified-traders">Verified Traders</a></li>
              <li><a href="/methodology">Methodology</a></li>
            </ul>
          </section>
        </main>`;
}

const pages = [
  page({
    route: "/about",
    title: "About Green Turtle Trades | UK Trader-Backed Investing Platform",
    description:
      "About Green Turtle Trades: a UK trader-backed investing platform for fintech investment, copy trading, trader marketplace, and prop firm alternative searches.",
    keywords:
      "about Green Turtle Trades, trader-backed investing platform, fintech investment platform, copy trading platform, trader marketplace, prop firm alternative, verified trader platform, trader performance verification, trading transparency, Turtle Analytics",
    h1: "About Green Turtle Trades",
    paragraphs: [
      "Green Turtle Trades was started by four university students based in Edinburgh after seeing more people pulled into trading propaganda, signal groups, and unverifiable performance claims.",
      "Green Turtle Trades is building the UK's most transparent platform for trader-backed investing by helping traders, investors, and evaluators review performance through trade history, risk, consistency, and public trader summaries.",
      "Green Turtle Trades is a trader-backed investing platform built for people comparing fintech investment platforms, copy trading platforms, trader marketplaces, and prop firm alternatives.",
      "The platform focuses on trading analytics, trader verification, trading journal workflows, transparent performance records through Turtle Analytics, and the public university competition leaderboard.",
    ],
    topics: [
      "Trader-backed investing",
      "Trader performance transparency",
      "Trading analytics",
      "Fintech investment platform",
      "Copy trading platform",
      "Trader marketplace",
      "Prop firm alternative",
      "Edinburgh startup",
    ],
    schemaType: "AboutPage",
    headline: "Building the UK's most transparent platform for trader-backed investing",
  }),
  page({
    route: "/turtle-analytics",
    title: "Turtle Analytics | Trading Journal and Trading Analytics",
    description:
      "Use Turtle Analytics as a trading journal and trading analytics platform for MT4, MT5, Trading 212, CSV history, expectancy, drawdown, risk review, and trader performance tracking.",
    keywords:
      "Turtle Analytics, trading journal, trading analytics, MT4 trading journal, MT5 trading journal, trading performance tracker, expectancy, drawdown analysis, trading risk management",
    h1: "Turtle Analytics",
    headline: "Trading journal, performance analytics, and risk review for serious traders.",
    paragraphs: [
      "Turtle Analytics is the Green Turtle Trades product hub for trading journals, trading analytics, performance tracking, and risk review.",
      "Traders can bring account history into one structured workflow through MetaTrader 4, MetaTrader 5, Trading 212, or CSV imports, then review the record through journal rows, account ledgers, stats cards, and analytics dashboards.",
      "The trading journal keeps entries, exits, direction, symbol, holding time, notes, and account activity in one place so traders can review decisions as well as outcomes.",
      "The analytics layer focuses on practical performance metrics including win rate, average return, profit factor, expectancy, R-multiple, best and worst trades, average hold time, market exposure, and total realised performance.",
      "Risk tools help traders understand drawdown, risk per trade, open exposure, leverage where available, stop-loss behaviour, largest loss, and consistency across their own history.",
      "Turtle Analytics does not predict market prices. It reviews historical trading behaviour so traders can see what happened, where risk increased, and which patterns may need more discipline.",
      "Raw journal records and account details remain private by default. Public trader summaries should use controlled metrics and methodology-backed calculations rather than exposing private trade data.",
    ],
    topics: [
      "Trading journal",
      "Trading analytics",
      "MT4 trading journal",
      "MT5 trading journal",
      "Trading performance tracker",
      "Expectancy analysis",
      "Drawdown analysis",
      "Trading risk management",
      "Trade history analysis",
      "Trader performance transparency",
    ],
    schemaType: "SoftwareApplication",
    extraGraph: [
      {
        "@type": "SoftwareApplication",
        name: "Turtle Analytics",
        alternateName: ["Green Turtle Trades Trading Journal", "Green Turtle Trades Trading Analytics"],
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: `${siteUrl}/turtle-analytics`,
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        description:
          "Turtle Analytics is a trading journal and trading analytics product for reviewing imported trade history, expectancy, drawdown, risk, account activity, and trader performance.",
        featureList: [
          "Trading journal",
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
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is Turtle Analytics?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Turtle Analytics is the Green Turtle Trades trading journal and analytics product for reviewing trade history, expectancy, drawdown, risk, account activity, and trader performance.",
            },
          },
          {
            "@type": "Question",
            name: "Can Turtle Analytics work with MT4 and MT5 trading history?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Turtle Analytics supports MetaTrader-connected workflows for MT4 and MT5 traders, alongside Trading 212 and CSV import workflows where available.",
            },
          },
          {
            "@type": "Question",
            name: "Which trading metrics does Turtle Analytics review?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Turtle Analytics reviews metrics such as win rate, expectancy, profit factor, R-multiple, drawdown, risk per trade, hold time, trade count, best trade, worst trade, and performance by behaviour pattern.",
            },
          },
          {
            "@type": "Question",
            name: "Does Turtle Analytics predict market prices?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Turtle Analytics focuses on historical trading behaviour, journal records, and performance analysis. It does not guarantee returns or predict market prices.",
            },
          },
          {
            "@type": "Question",
            name: "Are raw trade records public?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Raw journal records and account details remain private by default. Public pages should use controlled summary metrics rather than exposing private trade data.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/university-competition",
    title: "University Investment Competition Leaderboard Scotland | Green Turtle Trades",
    description:
      "Scotland's next generation of investors, ranked live. The canonical Green Turtle Trades hub for the university investment competition, live leaderboard, student trader rankings, virtual capital, risk scoring, and Scottish university performance.",
    keywords:
      "Scotland's next generation of investors, university investment competition, Scottish university investment competition, student investing competition Scotland, university competition leaderboard, student trader leaderboard, virtual trading competition, investment competition, Green Turtle Trades competition, risk free investing competition",
    headline: "Scotland's next generation of investors, ranked live.",
    h1: "University Investment Competition Leaderboard",
    paragraphs: [
      "Scotland's next generation of investors, ranked live. This is the canonical Green Turtle Trades hub for the university investment competition, student investing competition, and virtual trading competition.",
      "The public leaderboard helps visitors follow Scottish university competitors using live ranking data, individual trader scores, university scores, return metrics, realised and unrealised performance, risk labels, win rate, backers, trade count, and competition activity.",
      "Students trade with virtual capital in a risk-free environment while universities compete on individual performance, active participation, disciplined risk, trader-backing activity, and overall team results.",
      "The competition is designed to help students learn practical investing, portfolio discipline, risk control, and market decision-making before real capital is involved.",
      "Rankings should be powered by in-house competition execution data and central scoring logic so the public website, competition app, and admin views stay aligned.",
      "Public competition rankings are informational and educational. They are not financial advice and do not guarantee future investment returns.",
    ],
    topics: [
      "University investment competition",
      "Student investing competition Scotland",
      "Scottish university trading leaderboard",
      "Risk-free virtual investing competition",
      "Investment competition",
      "Virtual trading competition",
      "Student trader leaderboard",
      "Scottish university investing",
    ],
    extraGraph: [
      {
        "@type": "Event",
        name: "Green Turtle Trades University Investment Competition",
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "VirtualLocation",
          url: competitionAppUrl,
        },
        organizer: {
          "@id": `${siteUrl}/#organization`,
        },
        sameAs: competitionAppUrl,
        workFeatured: {
          "@id": `${competitionAppUrl}/#webapp`,
        },
        description:
          "The official secure competition app for Green Turtle Trades university competitors, connected to the public university competition leaderboard.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is the Green Turtle Trades University Investment Competition?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "It is a Scottish university investment competition where students use virtual capital, build practical investing experience, and appear on public individual and university leaderboards.",
            },
          },
          {
            "@type": "Question",
            name: "Is this the main competition page?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The canonical public competition hub is https://greenturtletraders.co.uk/university-competition. Other competition search variants should point to this page.",
            },
          },
          {
            "@type": "Question",
            name: "Does the competition use real money?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Competitors use virtual market capital, so students can gain practical market experience without risking personal money.",
            },
          },
          {
            "@type": "Question",
            name: "How are competitors ranked?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Competitors are ranked using central competition scoring that considers performance, risk, participation, drawdown, trade activity, and trader-backing signals.",
            },
          },
          {
            "@type": "Question",
            name: "Are competition rankings financial advice?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Public competition rankings are informational and educational. They are not financial advice and do not guarantee future investment returns.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/methodology",
    title: "Trader Verification Methodology | Green Turtle Trades",
    description:
      "Green Turtle Trades methodology for trader verification, trading analytics, risk metrics, public performance summaries, and university competition calculations.",
    keywords:
      "trader verification methodology, verified trading performance, trading analytics methodology, trader performance verification, trading risk metrics, Green Turtle Trades methodology",
    h1: "Trader Verification Methodology",
    headline: "How Green Turtle Trades verifies trader records, calculates performance, and labels public data.",
    paragraphs: [
      "Green Turtle Trades uses structured trading records, account-level summaries, risk metrics, and clearly labelled public data to make trader performance easier to evaluate.",
      "Verification means a trading record is supported by platform-recorded activity, connected account data, imported trade history, or in-house competition execution records. It does not mean Green Turtle Trades guarantees future performance, approves a trader as risk-free, or verifies every external statement a trader may make outside the platform.",
      "Green Turtle Trades can use in-house competition orders and executions, trader journal records, imported broker history, MetaTrader-connected history, account balance records, and platform activity logs depending on the product area.",
      "Realised P/L should come from closed trades. Unrealised P/L should come from open positions using the latest available market mark. Total P/L combines realised and unrealised values where appropriate.",
      "Risk analysis can consider drawdown, average risk per trade, leverage where available, missing stop-loss behaviour, open exposure, largest loss, and concentration. Risk labels are summary indicators, not investment recommendations.",
      "University competition rankings use in-house competition data and central scoring logic so public pages, the app, and admin views do not drift apart.",
      "Public rankings, analytics, trader summaries, and competition data are informational and should not be treated as financial advice or guarantees of future results.",
    ],
    topics: [
      "Trader verification methodology",
      "Verified trading performance",
      "Trading analytics methodology",
      "Risk metrics",
      "Competition scoring",
      "Trader performance transparency",
    ],
    extraGraph: [
      {
        "@type": "TechArticle",
        headline: "Green Turtle Trades Trader Verification Methodology",
        url: `${siteUrl}/methodology`,
        datePublished: "2026-08-20",
        dateModified: "2026-08-20",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        about: [
          "Trader verification",
          "Trading analytics",
          "Risk metrics",
          "Competition scoring",
          "Verified trading performance",
        ],
        description:
          "A public methodology summary explaining how Green Turtle Trades labels data sources, calculates performance, treats realised and unrealised P/L, reviews risk, and handles university competition calculations.",
      },
    ],
  }),
  page({
    route: "/investment-competition",
    canonicalRoute: "/university-competition",
    title: "Investment Competition | Green Turtle Trades",
    description:
      "A public investment competition from Green Turtle Trades where Scottish university students trade virtual capital, build market experience, and compete on transparent rankings.",
    keywords:
      "investment competition, investing competition, trading competition, university investment competition, student investment competition, virtual investment competition, Green Turtle Trades competition",
    h1: "Investment Competition",
    paragraphs: [
      "The canonical Green Turtle Trades competition hub is the University Investment Competition page.",
      "The Green Turtle Trades investment competition gives students a practical way to learn markets without risking personal capital.",
      "Competitors trade with virtual market capital, follow clear rules, and appear on transparent leaderboards powered by in-house execution data.",
      "Rankings consider return, win rate, participation, risk control, drawdown, and trader-backing activity so the competition rewards disciplined investing rather than headline return alone.",
    ],
    topics: [
      "Investment competition",
      "University investment competition",
      "Student investment competition",
      "Virtual investing competition",
    ],
  }),
  page({
    route: "/student-investing-competition",
    canonicalRoute: "/university-competition",
    title: "Student Investing Competition | Green Turtle Trades",
    description:
      "A student investing competition for Scottish universities, helping students learn trading, portfolio discipline, risk control, and market decision-making with virtual capital.",
    keywords:
      "student investing competition, student investment competition, university investing competition, Scottish student trading competition, student trading challenge, university finance competition",
    h1: "Student Investing Competition",
    paragraphs: [
      "The canonical Green Turtle Trades student competition hub is the University Investment Competition page.",
      "The Green Turtle Trades student investing competition is designed for students who want practical market experience.",
      "Scottish university competitors use virtual capital to trade, review performance, understand drawdown, and see how their decisions affect individual and university rankings.",
      "The public leaderboard shows score, return, win rate, risk, backers, and trade count so performance can be understood in context.",
    ],
    topics: [
      "Student investing competition",
      "Scottish university trading competition",
      "University finance competition",
      "Student trading challenge",
    ],
  }),
  page({
    route: "/virtual-trading-competition",
    canonicalRoute: "/university-competition",
    title: "Virtual Trading Competition | Green Turtle Trades",
    description:
      "A virtual trading competition where students use demo capital, compete on live rankings, and learn investing discipline through market execution data.",
    keywords:
      "virtual trading competition, virtual investing competition, demo trading competition, paper trading competition, student virtual trading, risk free trading competition",
    h1: "Virtual Trading Competition",
    paragraphs: [
      "The canonical Green Turtle Trades virtual competition hub is the University Investment Competition page.",
      "A virtual trading competition helps people practise market decision-making before real money is on the line.",
      "Green Turtle Trades uses virtual competition capital, transparent scoring, and public ranking data to make student investing more practical and measurable.",
      "The aim is to help students move beyond theory by building a measurable record of investment decisions, risk habits, and performance improvement.",
    ],
    topics: [
      "Virtual trading competition",
      "Demo trading competition",
      "Paper trading competition",
      "Risk-free trading competition",
    ],
  }),
  page({
    route: "/green-turtle-trades",
    title: "Green Turtle Trades and Green Turtle Traders | UK Trading Analytics Platform",
    description:
      "Green Turtle Trades, also searched as Green Turtle Traders, is a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited, company number SC878660.",
    keywords:
      "green turtle trades, green turtle traders, Green Turtle Trades Limited, Green Turtle Traders UK, green turtle trading platform, SC878660, UK trading analytics platform, verified trader platform, Turtle Analytics",
    h1: "Green Turtle Trades and Green Turtle Traders",
    paragraphs: [
      "Green Turtle Trades is a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited, company number SC878660.",
      "Green Turtle Traders is a common search variation connected to the official domain greenturtletraders.co.uk. Both names refer to the same platform and company.",
      "The official website is greenturtletraders.co.uk. The platform helps traders review trade history, use Turtle Analytics, keep a trading journal, and build transparent performance records.",
      "Green Turtle Trades is not the Turtle Trading strategy, the historical Turtle Trading experiment, or a trend-following rules system. The turtle wording is only a brand play on the name.",
      "Green Turtle Trades is not related to wildlife trade or green sea turtle products.",
    ],
    topics: [
      "Green Turtle Trades",
      "Green Turtle Traders",
      "Green Turtle Trades Limited",
      "Trading analytics",
      "Verified trader platform",
      "Not Turtle Trading strategy",
    ],
    extraGraph: [organizationProfilePage(`${siteUrl}/green-turtle-trades`)],
  }),
  page({
    route: "/what-is-green-turtle-trades",
    canonicalRoute: "/green-turtle-trades",
    title: "Green Turtle Trades and Green Turtle Traders | UK Trading Analytics Platform",
    description:
      "Green Turtle Trades, also searched as Green Turtle Traders, is a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited, company number SC878660.",
    keywords:
      "green turtle trades, green turtle traders, Green Turtle Trades Limited, Green Turtle Traders UK, green turtle trading platform, SC878660, UK trading analytics platform, verified trader platform, Turtle Analytics",
    h1: "Green Turtle Trades and Green Turtle Traders",
    paragraphs: [
      "Green Turtle Trades is a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited, company number SC878660.",
      "This alias page points search engines to the official company overview at greenturtletraders.co.uk/green-turtle-trades.",
      "The platform helps traders review trade history, use Turtle Analytics, keep a trading journal, and build transparent performance records.",
    ],
    topics: [
      "Green Turtle Trades",
      "Green Turtle Traders",
      "Green Turtle Trades Limited",
      "Trading analytics",
      "Verified trader platform",
    ],
    extraGraph: [organizationProfilePage(`${siteUrl}/green-turtle-trades`)],
  }),
  page({
    route: "/green-turtle-traders",
    canonicalRoute: "/green-turtle-trades",
    title: "Green Turtle Trades and Green Turtle Traders | UK Trading Analytics Platform",
    description:
      "Green Turtle Traders is a common search variation for Green Turtle Trades, a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited.",
    keywords:
      "green turtle traders, green turtle trades, Green Turtle Trades Limited, Green Turtle Traders UK, green turtle trading platform, trading analytics, verified trader platform, Turtle Analytics",
    h1: "Green Turtle Trades and Green Turtle Traders",
    paragraphs: [
      "Green Turtle Traders is a common search variation for Green Turtle Trades and the official website greenturtletraders.co.uk.",
      "This alias page points search engines to the official company overview at greenturtletraders.co.uk/green-turtle-trades.",
      "Green Turtle Trades provides trading analytics, Turtle Analytics, trading journal workflows, public competition rankings, and transparent trader performance records.",
    ],
    topics: [
      "Green Turtle Traders",
      "Green Turtle Trades",
      "Trading analytics",
      "Turtle Analytics",
      "Verified trader platform",
    ],
    extraGraph: [organizationProfilePage(`${siteUrl}/green-turtle-trades`)],
  }),
  page({
    route: "/what-is-green-turtle-traders",
    canonicalRoute: "/green-turtle-trades",
    title: "Green Turtle Trades and Green Turtle Traders | UK Trading Analytics Platform",
    description:
      "Green Turtle Traders is a search variation for Green Turtle Trades, a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited.",
    keywords:
      "what is green turtle traders, green turtle traders, green turtle trades, Green Turtle Trades Limited, UK trading analytics platform, Turtle Analytics",
    h1: "Green Turtle Trades and Green Turtle Traders",
    paragraphs: [
      "Green Turtle Traders is a search variation for Green Turtle Trades, the UK trading analytics and verified trader platform.",
      "This alias page points search engines to the official company overview at greenturtletraders.co.uk/green-turtle-trades.",
      "The platform helps traders review trade history, use Turtle Analytics, keep a trading journal, and build transparent performance records.",
    ],
    topics: [
      "Green Turtle Traders",
      "Green Turtle Trades",
      "UK trading analytics platform",
      "Turtle Analytics",
    ],
    extraGraph: [organizationProfilePage(`${siteUrl}/green-turtle-trades`)],
  }),
  page({
    route: "/trading-analytics",
    title: "Trading Analytics | Green Turtle Trades",
    description:
      "Trading analytics helps traders review trade history, expectancy, win rate, profit factor, drawdown, risk per trade, holding time, and performance behaviour with clearer data.",
    keywords:
      "trading analytics, trading performance analytics, trading analytics platform, trade analytics, trading performance analysis, trader analytics, trading statistics, Turtle Analytics",
    h1: "Trading Analytics",
    headline: "Turn trade history into performance evidence, risk insight, and clearer trader analytics.",
    paragraphs: [
      "Trading analytics turns trade history into evidence. Green Turtle Trades gives traders a clearer way to understand performance by connecting account history, journal records, risk metrics, and Turtle Analytics dashboards.",
      "Trading analytics is the process of reviewing trade history, risk, return, timing, behaviour, and consistency to understand how a trader is actually performing.",
      "A trading journal records decisions, notes, and lessons. A performance tracker summarizes results. Trading analytics goes further by connecting those records to deeper metrics, behaviour patterns, risk quality, and possible areas for improvement.",
      "Good trading analytics should explain what is happening across actual trades, not rely on screenshots or headline returns.",
      "Useful trading analytics include expectancy, win rate, R-multiple, profit factor, average win, average loss, risk/reward, risk per trade, drawdown, holding time, trade count, best trade, worst trade, sample size, and consistency.",
      "Raw P/L can be misleading if it was produced by oversized positions, high leverage, or a single outlier trade. Green Turtle Trades reviews performance alongside drawdown, open exposure, stop-loss behaviour, leverage where available, and risk consistency.",
      "Turtle Analytics can support analytics workflows from journal records, platform activity, MetaTrader-connected MT4 and MT5 history, Trading 212 history, and CSV imports where available.",
      "Analytics should distinguish realised performance from closed trades and unrealised performance from open positions. That separation helps prevent confusion between completed results and live exposure.",
      "Raw trade data, account details, and notes remain private by default. Public summaries should use controlled metrics and methodology-backed calculations.",
    ],
    topics: [
      "Trading analytics",
      "Trading performance analysis",
      "Risk analytics",
      "Turtle Analytics",
      "Trading journal",
      "Trading performance tracker",
      "Expectancy",
      "Profit factor",
      "Drawdown",
      "Risk per trade",
      "Trader analytics",
    ],
    extraGraph: [
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is trading analytics?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Trading analytics is the process of reviewing trade history, risk, return, expectancy, win rate, drawdown, timing, and behaviour patterns to understand trading performance.",
            },
          },
          {
            "@type": "Question",
            name: "How is trading analytics different from a trading journal?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A trading journal records decisions, notes, and lessons. Trading analytics turns those records into metrics and patterns such as expectancy, drawdown, profit factor, and risk behaviour.",
            },
          },
          {
            "@type": "Question",
            name: "Which trading analytics metrics matter most?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Useful metrics include expectancy, win rate, R-multiple, profit factor, average win, average loss, risk per trade, drawdown, holding time, sample size, and consistency.",
            },
          },
          {
            "@type": "Question",
            name: "Can Turtle Analytics use MT4 or MT5 history?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Turtle Analytics supports MetaTrader-connected workflows for MT4 and MT5 traders, alongside Trading 212 history and CSV import workflows where available.",
            },
          },
          {
            "@type": "Question",
            name: "Does Turtle Analytics predict market prices?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Turtle Analytics focuses on historical trade behaviour and performance analysis. It does not make market predictions or guarantee returns.",
            },
          },
          {
            "@type": "Question",
            name: "Should analytics include open positions?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Open positions can be included when reviewing full account exposure, but unrealised performance should be labelled separately from realised closed-trade performance.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/trading-journal",
    title: "Trading Journal | Green Turtle Trades",
    description:
      "A trading journal for recording trades, reviewing decisions, tracking lessons, measuring expectancy, and understanding risk across your trading history.",
    keywords:
      "trading journal, trade journal, trading journal app, MT4 trading journal, MT5 trading journal, trading performance journal, trade notes, trading analytics journal",
    h1: "Trading Journal",
    headline: "A structured trading journal for decisions, risk, lessons, and performance review.",
    paragraphs: [
      "A trading journal helps traders turn trade history into feedback by recording notes, lessons, decisions, outcomes, and risk.",
      "Green Turtle Trades helps traders keep a structured record of entries, exits, symbols, direction, position size, stop loss, take profit, risk, holding time, order type, setup, market context, and account activity.",
      "The journal is designed to review decisions as well as outcomes. Traders should be able to see whether a trade followed the plan, whether risk was controlled, whether the exit was disciplined, and whether the same mistake keeps appearing over time.",
      "Green Turtle Trades connects journal records with Turtle Analytics so traders can move from simple record keeping to deeper performance analysis across expectancy, profit factor, win rate, drawdown, holding time, R-multiple, best and worst trades, and risk behaviour.",
      "Turtle Analytics supports MetaTrader-connected workflows for MT4 and MT5 traders, Trading 212 history, and CSV imports where available, then brings that history into one structured journal and analytics workflow.",
      "Risk belongs inside the trading journal. Traders can review drawdown, risk per trade, open exposure, leverage where available, largest loss, missing stop-loss behaviour, and consistency signals across their own history.",
      "Raw journal trades, private notes, and account details stay private by default. Public performance should use controlled summary metrics and methodology-backed calculations rather than exposing private records.",
    ],
    topics: [
      "Trading journal",
      "Trade journal",
      "MT4 trading journal",
      "MT5 trading journal",
      "Trader performance records",
      "Trading notes",
      "Expectancy",
      "Drawdown",
      "Risk per trade",
    ],
    extraGraph: [
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What should a trading journal include?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A trading journal should include entry and exit data, symbol, direction, position size, stop loss, take profit, risk, holding time, notes, trade lessons, market context, and performance metrics.",
            },
          },
          {
            "@type": "Question",
            name: "Is a trading journal useful for beginners?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. A journal helps new traders build discipline, review mistakes, and understand whether progress is based on repeatable behaviour.",
            },
          },
          {
            "@type": "Question",
            name: "Can a trading journal connect to MT4 or MT5?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Turtle Analytics supports MetaTrader-connected workflows for MT4 and MT5 traders, alongside Trading 212 history and CSV import workflows where available.",
            },
          },
          {
            "@type": "Question",
            name: "Which trading journal metrics matter most?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Useful journal metrics include expectancy, win rate, profit factor, average win, average loss, risk/reward, drawdown, risk per trade, holding time, and trade count.",
            },
          },
          {
            "@type": "Question",
            name: "Are my journal trades public?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Raw journal trades, notes, and account details stay private by default. Only controlled summary stats can appear publicly if a trader enables public performance features.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/verified-traders",
    title: "Verified Traders | Green Turtle Trades",
    description:
      "Verified traders on Green Turtle Trades are evaluated through structured performance records, risk metrics, journal data, and transparent public summaries rather than screenshots alone.",
    keywords:
      "verified traders, verified trading performance, trader verification, transparent traders, verified trading records, trader performance verification, risk adjusted trader performance",
    h1: "Verified Traders",
    headline: "Trader verification built around evidence, risk metrics, and transparent summaries.",
    paragraphs: [
      "Verified trader data matters because trust cannot be built from screenshots, claims, or isolated winning trades.",
      "Green Turtle Trades is designed around structured performance records, risk controls, trading analytics, journal data, and clearly labelled public summaries.",
      "A trader's headline return is not enough. A useful verification workflow should help explain whether results came from repeatable behaviour, responsible risk, a meaningful trade sample, and real trading history rather than edited screenshots or unsupported claims.",
      "Verification means a trading record is supported by platform-recorded activity, connected account data, imported broker history, MetaTrader-connected history, or in-house competition execution records. It does not mean Green Turtle Trades guarantees future performance or labels any trader as risk-free.",
      "Trader evaluation should look beyond profit and loss. Green Turtle Trades focuses on metrics such as win rate, expectancy, drawdown, profit factor, risk per trade, average hold time, open exposure, sample size, and consistency so users can understand the shape of performance.",
      "Public trader profiles should show controlled summary performance while keeping raw trades, account details, private notes, and personal information protected.",
      "Green Turtle Trades is building toward a trader-backed investing model where capital decisions can be informed by clearer evidence. Verified records, risk-adjusted analytics, and transparent summaries are the foundation for that future workflow.",
      "Public rankings, verified summaries, and trader analytics are informational and should not be treated as financial advice or guarantees of future results.",
    ],
    topics: [
      "Verified traders",
      "Trader verification",
      "Verified trading records",
      "Trading transparency",
      "Risk-adjusted performance",
      "Trader performance verification",
      "Trading analytics",
      "Trader-backed investing",
    ],
    extraGraph: [
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is a verified trader?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A verified trader is a trader whose performance can be reviewed through platform-recorded activity, connected account data, imported broker history, MetaTrader-connected records, or in-house competition execution data rather than unsupported claims alone.",
            },
          },
          {
            "@type": "Question",
            name: "Does verified mean risk-free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Verified means the record is supported by a data source. It does not mean future performance is guaranteed or that the trader is risk-free.",
            },
          },
          {
            "@type": "Question",
            name: "Do verified traders publish every raw trade?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Raw trades, account details, and private notes stay private by default. Public pages should show controlled summary statistics such as return, win rate, expectancy, risk, drawdown, and trade count.",
            },
          },
          {
            "@type": "Question",
            name: "Which metrics matter for trader verification?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Useful verification metrics include realised and unrealised return, win rate, expectancy, profit factor, drawdown, risk per trade, average hold time, sample size, exposure, and consistency.",
            },
          },
          {
            "@type": "Question",
            name: "Are verified trader summaries financial advice?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Public rankings, verified summaries, and trader analytics are informational and should not be treated as financial advice or guarantees of future results.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/investor-capital-for-traders",
    title: "Investor Capital for Traders | Green Turtle Trades",
    description:
      "Green Turtle Trades helps connect skilled verified traders with investor capital through transparent performance data.",
    keywords:
      "investor capital for traders, trader funding, trading capital, verified traders investor capital, capital for traders",
    h1: "Investor Capital for Traders",
    paragraphs: [
      "Many skilled traders need reliable capital, while investors need clearer ways to evaluate trader performance.",
      "Green Turtle Trades is building a transparent bridge between trader skill and investor capital, with a focus on verified performance and responsible risk.",
    ],
    topics: ["Investor capital", "Trader-backed investing", "Trader funding"],
  }),
  page({
    route: "/trader-marketplace",
    title: "Trader Marketplace Built Around Verified Performance | Green Turtle Trades",
    description:
      "A trader marketplace built around verified trader performance, transparent metrics, trading analytics, and clearer investor decision-making.",
    keywords:
      "trader marketplace, trading marketplace, verified trader marketplace, trader performance marketplace, copy trading platform, trader-backed investing",
    h1: "Trader Marketplace Built Around Verified Performance",
    paragraphs: [
      "A trader marketplace should make trader comparison clearer. Green Turtle Trades is building a transparent way to review trader records, risk, consistency, and public performance summaries before capital follows skill.",
      "Green Turtle Trades focuses on meaningful metrics such as win rate, expectancy, risk per trade, sample size, drawdown, and consistency.",
      "The public traders leaderboard gives visitors a transparent summary of opted-in trader performance while keeping raw trades private.",
      "The long-term aim is a trader-backed investing platform where capital allocation can be informed by verified records, risk behaviour, and long-term performance data.",
    ],
    topics: ["Trader marketplace", "Trader comparison", "Verified trader metrics", "Trader-backed investing"],
  }),
  page({
    route: "/copy-trading-platform",
    title: "Copy Trading Platform With Verified Trader Data | Green Turtle Trades",
    description:
      "A copy trading platform approach focused on verified trader performance, transparent risk metrics, public summaries, and clearer investor decision-making.",
    keywords:
      "copy trading platform, copy trading, copy trader, verified copy trading, transparent copy trading platform, copy trading alternative, trader-backed investing",
    h1: "Copy Trading Platform With Verified Trader Data",
    paragraphs: [
      "Copy trading should be easier to evaluate before anyone follows a trader. Green Turtle Trades is designed around verified performance, risk visibility, and public trader summaries.",
      "A stronger copy trading workflow starts with verified trader performance, not screenshots or unsupported claims.",
      "Risk per trade, drawdown behaviour, sample size, expectancy, and win rate all help investors understand whether performance is sustainable.",
      "Green Turtle Trades is being built as a more evidence-led approach to trader-backed investing.",
    ],
    topics: ["Copy trading", "Verified copy trading", "Trading risk metrics", "Copy trading alternative"],
  }),
  page({
    route: "/trader-funding",
    title: "Trader Funding | Green Turtle Trades",
    description:
      "Trader funding information for skilled traders looking to build transparent performance records and access investor capital.",
    keywords:
      "trader funding, funded trader, trading capital, funded trading account, capital for traders, trader funding platform",
    h1: "Trader Funding",
    paragraphs: [
      "Trader funding should reward real skill, disciplined risk, and transparent performance.",
      "Green Turtle Trades helps traders build the kind of performance record investors can understand.",
    ],
    topics: ["Trader funding", "Funded trader", "Trading capital"],
  }),
  page({
    route: "/prop-firm-alternative",
    title: "Prop Firm Alternative for Trader-Backed Investing | Green Turtle Trades",
    description:
      "A transparent prop firm alternative focused on verified trader performance, trading analytics, risk records, and aligned investor capital.",
    keywords:
      "prop firm alternative, prop trading alternative, funded trader alternative, trader capital alternative, trading challenge alternative, trader-backed investing",
    h1: "Prop Firm Alternative for Trader-Backed Investing",
    paragraphs: [
      "Many traders want capital without relying only on short-term challenges or unclear incentives.",
      "Green Turtle Trades is building a more transparent prop firm alternative focused on verified data, responsible risk, and longer-term trader evidence.",
      "Trading analytics, journal records, win rate, expectancy, risk control, and verified trade sample size create a better foundation for evaluating traders than pass-fail challenge outcomes alone.",
      "The aim is to make trader funding and investor-capital decisions more evidence-led.",
    ],
    topics: ["Prop firm alternative", "Funded trader alternative", "Verified trader performance", "Trader-backed investing"],
  }),
  page({
    route: "/trading-performance-tracker",
    title: "Trading Performance Tracker | Green Turtle Trades",
    description:
      "Track trading performance with metrics such as win rate, expectancy, R-multiple, profit factor, risk per trade, drawdown, holding time, trade count, and consistency.",
    keywords:
      "trading performance tracker, trading performance, trade tracker, trading metrics, track trading performance, trading statistics, trading dashboard, trader performance analytics",
    h1: "Trading Performance Tracker",
    headline: "Track trading results, risk, consistency, and performance quality.",
    paragraphs: [
      "A trading performance tracker helps traders understand whether results are consistent, risk-aware, and repeatable. Green Turtle Trades combines performance tracking with journal records, account history, risk analytics, and Turtle Analytics dashboards.",
      "A trading performance tracker records and summarizes trading results so traders can review the full pattern behind their trades. It should show more than account balance by connecting trade outcomes, risk, timing, notes, and behaviour.",
      "Win rate, expectancy, R-multiple, profit factor, average win, average loss, risk/reward, risk per trade, drawdown, holding time, trade count, best trade, worst trade, and sample size all help explain whether trading results come from a repeatable edge.",
      "A small number of winning trades can create misleading confidence. A useful performance tracker should help traders judge whether results are backed by enough trades, whether wins and losses are consistent, and whether one outlier trade is doing too much of the work.",
      "Performance tracking is most useful when it links results to trader behaviour, notes, timing, market conditions, setup quality, and risk decisions.",
      "Performance pages should distinguish realised P/L from closed trades and unrealised P/L from open positions. Total performance is clearer when the source of each figure is labelled and calculated consistently.",
      "Raw return is not enough. Turtle Analytics helps traders review performance alongside drawdown, risk per trade, exposure, leverage where available, profit factor, and expectancy so performance quality is easier to evaluate.",
      "Private tracking can include raw trades, notes, account history, and journal records. Public summaries should use controlled metrics such as return, win rate, trade count, risk, and drawdown without exposing private account details.",
    ],
    topics: [
      "Trading performance tracker",
      "Trading metrics",
      "Trade tracking",
      "Trading dashboard",
      "Expectancy",
      "Profit factor",
      "Drawdown",
      "Risk per trade",
      "Trading statistics",
      "Trader performance analytics",
    ],
    extraGraph: [
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is a trading performance tracker?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A trading performance tracker records and summarizes trading results so traders can review metrics such as win rate, expectancy, risk, drawdown, holding time, and trade history.",
            },
          },
          {
            "@type": "Question",
            name: "Which trading metrics matter most?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Useful metrics include expectancy, win rate, R-multiple, profit factor, average win, average loss, risk per trade, drawdown, holding time, sample size, and consistency.",
            },
          },
          {
            "@type": "Question",
            name: "How is a performance tracker different from a trading journal?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A trading journal records trade context, notes, and lessons. A performance tracker summarizes the metrics across those trades. The strongest workflow connects both.",
            },
          },
          {
            "@type": "Question",
            name: "Why does sample size matter in trading performance?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Small samples can be misleading. More trade history makes it easier to judge whether performance is repeatable or driven by a few outlier trades.",
            },
          },
          {
            "@type": "Question",
            name: "Should unrealised P/L be included in performance tracking?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Unrealised P/L can be included when a page represents full account performance, but it should be labelled separately from realised P/L from closed trades.",
            },
          },
          {
            "@type": "Question",
            name: "Does performance tracking guarantee future returns?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Performance tracking reviews historical trading behaviour. It does not predict markets or guarantee future returns.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/trading-risk-management",
    title: "Trading Risk Management | Green Turtle Trades",
    description:
      "Trading risk management tools and analytics for reviewing risk per trade, drawdown, exposure, stop-loss behaviour, leverage, expectancy, and trader consistency.",
    keywords:
      "trading risk management, risk management trading, trading risk analytics, risk per trade, trading drawdown, stop loss analytics, trading exposure, risk reward ratio",
    h1: "Trading Risk Management",
    headline: "Review risk per trade, drawdown, exposure, stops, and trading consistency.",
    paragraphs: [
      "Risk management is central to serious trading. Green Turtle Trades helps traders review risk per trade, drawdown behaviour, open exposure, stop-loss discipline, leverage where available, expectancy, and performance consistency.",
      "Every trade has risk. The question is whether that risk is measured, controlled, and consistent with the trader's edge, account size, and trading plan.",
      "Risk per trade shows how much of the account is exposed if a trade fails. Reviewing this metric across a full trade history helps traders see whether they are sizing positions consistently or allowing one trade to carry too much account risk.",
      "Drawdown shows how far performance falls from a previous equity high. Largest loss shows how much damage one trade created. Together, they help traders understand whether returns are being earned with acceptable downside or hidden blow-up risk.",
      "A risk workflow should show whether trades have planned exits, whether stop-loss behaviour is consistent, and whether average reward is large enough compared with average risk.",
      "Open exposure, correlated positions, leverage where available, and concentrated symbols can all increase account vulnerability. Turtle Analytics helps traders review exposure alongside realised performance.",
      "Green Turtle Trades treats risk as part of performance quality. Verified summaries, trader comparisons, and competition scoring should consider return alongside drawdown, sample size, exposure, and risk consistency rather than rewarding raw P/L alone.",
      "Risk labels and analytics are informational summaries. They are not financial advice and do not guarantee future performance.",
    ],
    topics: [
      "Trading risk management",
      "Risk per trade",
      "Drawdown analytics",
      "Stop-loss behaviour",
      "Trading exposure",
      "Risk reward ratio",
      "Trading leverage",
      "Risk-adjusted performance",
    ],
    extraGraph: [
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is trading risk management?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Trading risk management is the process of controlling position size, risk per trade, drawdown, exposure, stop-loss behaviour, leverage, and decision quality across trades.",
            },
          },
          {
            "@type": "Question",
            name: "Why is risk per trade important?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Risk per trade shows how much a trader is exposing on each position. Consistent risk helps make performance easier to evaluate.",
            },
          },
          {
            "@type": "Question",
            name: "What is trading drawdown?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Drawdown measures how far an account or strategy falls from a previous equity high to a later low. It helps show downside risk behind the returns.",
            },
          },
          {
            "@type": "Question",
            name: "Why is risk/reward important?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Risk/reward compares how much a trader risks against the potential or realised reward. A high win rate can still be weak if losses are much larger than wins.",
            },
          },
          {
            "@type": "Question",
            name: "Should open positions be included in risk review?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Open positions affect exposure, unrealised P/L, leverage, and concentration risk, so they should be reviewed alongside closed-trade performance.",
            },
          },
          {
            "@type": "Question",
            name: "Are risk labels investment advice?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Risk labels and analytics are informational summaries. They are not financial advice and do not guarantee future performance.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/trading-expectancy",
    title: "Trading Expectancy Explained | Green Turtle Trades",
    description:
      "Trading expectancy explained: formula, examples, win rate, average win, average loss, risk/reward, sample size, and how Turtle Analytics reviews expectancy.",
    keywords:
      "trading expectancy, expectancy trading, trading expectancy formula, trade expectancy, expectancy calculator trading, win rate risk reward, trading metrics",
    h1: "Trading Expectancy",
    headline: "Understand trading expectancy, win rate, average win, average loss, and risk/reward.",
    paragraphs: [
      "Trading expectancy helps traders understand the average expected outcome of a trade over a series of trades.",
      "Trading expectancy estimates the average result a trader can expect per trade based on historical outcomes. It is useful because it looks beyond whether a trader wins often and asks whether the size of wins is large enough compared with the size of losses.",
      "A common formula is: expectancy = (win rate x average win) - (loss rate x average loss). For example, if a trader wins 50% of trades, averages £120 on winners, and loses £70 on losers, expectancy is (0.50 x 120) - (0.50 x 70) = £25 per trade.",
      "A trader can have a high win rate and still lose money if losses are much larger than wins. A trader can also have a lower win rate and still be profitable if average wins are meaningfully larger than average losses.",
      "Expectancy connects directly to risk/reward. When a trader risks £100 to make £50, the win rate needs to be much higher than when a trader risks £100 to make £200.",
      "Expectancy is more useful when it is based on enough trades. A small sample can be distorted by one large win or loss, while a larger sample gives a clearer view of whether the trading process has a repeatable edge.",
      "Expectancy can be reviewed in currency terms, percentage terms, or R-multiple terms. R-multiple expectancy can be helpful because it normalizes outcomes by the amount risked on each trade.",
      "Turtle Analytics connects expectancy with journal records, trade history, risk per trade, drawdown, holding time, and setup behaviour.",
      "Expectancy is based on historical data. It does not predict future trades, remove market risk, or guarantee returns.",
    ],
    topics: [
      "Trading expectancy",
      "Trading expectancy formula",
      "Win rate",
      "Average win",
      "Average loss",
      "Risk reward ratio",
      "R-multiple",
      "Trading metrics",
      "Turtle Analytics",
      "Trading journal",
    ],
    extraGraph: [
      {
        "@type": "Article",
        headline: "Trading Expectancy Explained",
        url: `${siteUrl}/trading-expectancy`,
        datePublished: "2026-08-20",
        dateModified: "2026-08-20",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        about: [
          "Trading expectancy",
          "Trading metrics",
          "Risk reward ratio",
          "Trading journal",
          "Turtle Analytics",
        ],
        description:
          "An educational guide explaining trading expectancy, the expectancy formula, win rate, average win, average loss, sample size, and risk/reward.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is trading expectancy?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Trading expectancy is the average expected outcome per trade based on win rate, average win, loss rate, and average loss.",
            },
          },
          {
            "@type": "Question",
            name: "What is the trading expectancy formula?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A common formula is expectancy = (win rate x average win) - (loss rate x average loss).",
            },
          },
          {
            "@type": "Question",
            name: "Can a trader be profitable with a low win rate?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. A trader can be profitable with a lower win rate if average wins are large enough compared with average losses.",
            },
          },
          {
            "@type": "Question",
            name: "Why is expectancy better than win rate alone?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Win rate only shows how often trades win. Expectancy also considers the size of wins and losses, which gives a clearer view of performance quality.",
            },
          },
          {
            "@type": "Question",
            name: "Does positive expectancy guarantee future returns?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Positive historical expectancy does not guarantee future results. Market conditions, risk behaviour, sample size, and execution can all change.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/trading-drawdown",
    title: "Trading Drawdown Explained | Green Turtle Trades",
    description:
      "Trading drawdown explained: max drawdown, equity high to low, realised and unrealised drawdown, recovery math, risk control, and how Turtle Analytics reviews drawdown.",
    keywords:
      "trading drawdown, max drawdown trading, maximum drawdown, drawdown meaning trading, drawdown calculator trading, equity drawdown, trading risk management",
    h1: "Trading Drawdown",
    headline: "Understand trading drawdown, maximum drawdown, recovery math, and downside risk.",
    paragraphs: [
      "Trading drawdown shows how far an account, strategy, or trader falls from a previous equity high.",
      "Drawdown measures the fall from a previous equity peak to a later low. If an account rises to £110,000 and then falls to £100,000 before recovering, the drawdown from that peak is £10,000 or about 9.09%.",
      "Maximum drawdown is the largest peak-to-trough fall in the period being reviewed. It helps traders and evaluators understand the worst historical downside in a trading record.",
      "A single losing trade can contribute to drawdown, but drawdown measures the account-level decline across a sequence of trades or open positions.",
      "Realised drawdown comes from closed losses and account history. Unrealised drawdown can come from open positions moving against the trader.",
      "Two traders can both make 10%, but one may have experienced a 2% drawdown while another went through a 25% drawdown. The return number alone does not show how much downside risk was taken.",
      "The deeper a drawdown becomes, the larger the return needed to recover. A 10% drawdown needs about 11.1% to recover, while a 50% drawdown needs 100% to recover.",
      "Turtle Analytics reviews drawdown alongside trade history, risk per trade, open exposure, leverage where available, holding time, expectancy, and journal records.",
      "Drawdown is based on available historical data. It does not predict the next loss, remove trading risk, or guarantee that future drawdown will be smaller.",
    ],
    topics: [
      "Trading drawdown",
      "Maximum drawdown",
      "Max drawdown trading",
      "Equity drawdown",
      "Realised drawdown",
      "Unrealised drawdown",
      "Trading risk management",
      "Risk per trade",
      "Turtle Analytics",
      "Trading journal",
    ],
    extraGraph: [
      {
        "@type": "Article",
        headline: "Trading Drawdown Explained",
        url: `${siteUrl}/trading-drawdown`,
        datePublished: "2026-08-20",
        dateModified: "2026-08-20",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        about: [
          "Trading drawdown",
          "Maximum drawdown",
          "Risk management",
          "Trading analytics",
          "Turtle Analytics",
        ],
        description:
          "An educational guide explaining trading drawdown, maximum drawdown, equity peak-to-trough declines, realised and unrealised drawdown, recovery math, and risk control.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is drawdown in trading?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Drawdown in trading is the decline from a previous account or strategy equity high to a later low.",
            },
          },
          {
            "@type": "Question",
            name: "What is maximum drawdown?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Maximum drawdown is the largest peak-to-trough decline over the period being measured.",
            },
          },
          {
            "@type": "Question",
            name: "Why is drawdown important?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Drawdown shows the downside risk behind returns. It helps traders understand how much equity was lost before recovery.",
            },
          },
          {
            "@type": "Question",
            name: "Is drawdown the same as a loss?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. A loss is usually a single trade or realised outcome. Drawdown measures the wider equity decline from a previous high.",
            },
          },
          {
            "@type": "Question",
            name: "Should open positions count toward drawdown?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Open positions can affect unrealised drawdown. Pages should label whether drawdown includes open trade marks or only closed-trade performance.",
            },
          },
          {
            "@type": "Question",
            name: "Does low drawdown guarantee a safe trader?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Low historical drawdown does not guarantee future safety. Drawdown should be reviewed alongside exposure, sample size, leverage, risk per trade, and market conditions.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/profit-factor-trading",
    title: "Profit Factor in Trading Explained | Green Turtle Trades",
    description:
      "Profit factor in trading explained: formula, gross profit, gross loss, sample size, win rate, expectancy, drawdown, and how Turtle Analytics reviews profit factor.",
    keywords:
      "profit factor trading, trading profit factor, profit factor formula, good profit factor trading, gross profit gross loss, trading metrics, Turtle Analytics",
    h1: "Profit Factor in Trading",
    headline: "Understand profit factor, gross profit, gross loss, and trading payoff quality.",
    paragraphs: [
      "Profit factor shows how much gross profit a trader generated for every unit of gross loss.",
      "The common formula is: profit factor = gross profit / absolute gross loss.",
      "For example, if a trader made $1,500 from winning trades and lost $750 from losing trades, the profit factor is 2.0.",
      "Profit factor uses gross totals rather than net profit alone, so it can show whether gains were smooth and controlled or built from large swings.",
      "A profit factor above 1.0 is historically positive, but it does not automatically mean the strategy is strong.",
      "A very high profit factor can be distorted by a small trade sample, one large outlier, or a period with no meaningful losses.",
      "Profit factor should be reviewed alongside win rate, expectancy, average win, average loss, drawdown, holding time, risk per trade, and sample size.",
      "Turtle Analytics calculates journal profit factor from winning outcomes divided by the absolute value of losing outcomes when enough loss data exists.",
      "Profit factor is based on historical results. It does not predict future trades, remove market risk, or guarantee future performance.",
    ],
    topics: [
      "Profit factor trading",
      "Profit factor formula",
      "Gross profit",
      "Gross loss",
      "Trading metrics",
      "Trading expectancy",
      "Win rate",
      "Trading drawdown",
      "Turtle Analytics",
    ],
    extraGraph: [
      {
        "@type": "Article",
        headline: "Profit Factor in Trading Explained",
        url: `${siteUrl}/profit-factor-trading`,
        datePublished: "2026-08-20",
        dateModified: "2026-08-20",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        about: [
          "Profit factor",
          "Trading analytics",
          "Trading metrics",
          "Gross profit",
          "Gross loss",
          "Turtle Analytics",
        ],
        description:
          "An educational guide explaining profit factor in trading, the profit factor formula, gross profit, gross loss, sample size, win rate, expectancy, and risk context.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is profit factor in trading?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Profit factor is the ratio of gross profit from winning trades to the absolute gross loss from losing trades.",
            },
          },
          {
            "@type": "Question",
            name: "What is the profit factor formula?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The common formula is profit factor = gross profit / absolute gross loss.",
            },
          },
          {
            "@type": "Question",
            name: "What is a good profit factor?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A profit factor above 1.0 is historically positive, but it should be reviewed with sample size, drawdown, risk, and consistency.",
            },
          },
          {
            "@type": "Question",
            name: "Can profit factor be misleading?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Profit factor can be misleading when it is based on very few trades, one large outlier, or a period with no meaningful losses.",
            },
          },
          {
            "@type": "Question",
            name: "Is profit factor better than win rate?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Profit factor shows whether wins were large enough compared with losses, while win rate only shows how often trades won. Both should be reviewed together.",
            },
          },
          {
            "@type": "Question",
            name: "Does high profit factor guarantee future returns?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. High historical profit factor does not guarantee future returns. Market conditions, risk behaviour, and execution can all change.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/risk-reward-ratio-trading",
    title: "Risk/Reward Ratio in Trading Explained | Green Turtle Trades",
    description:
      "Risk/reward ratio in trading explained: planned risk, potential reward, realised average win/loss, win rate, expectancy, and how Turtle Analytics reviews risk/reward.",
    keywords:
      "risk reward ratio trading, risk/reward trading, trading risk reward ratio, reward risk ratio, win rate risk reward, trading expectancy",
    h1: "Risk/Reward Ratio in Trading",
    headline: "Understand planned risk/reward, realised average win/loss, win rate, and expectancy.",
    paragraphs: [
      "Risk/reward ratio compares how much a trader is risking with how much they are trying to make.",
      "A common formula is: risk/reward = potential reward / amount risked.",
      "If a trader risks $100 to target $200, the planned reward is twice the planned risk, often described as 2:1.",
      "Planned risk/reward uses the stop-loss, entry, and take-profit idea before the trade. Realised risk/reward uses what actually happened after trades closed.",
      "When stop-loss and take-profit data is incomplete, platforms can still review realised payoff quality by comparing average winner size with average loser size.",
      "A trader with a lower win rate can still be profitable if average wins are much larger than average losses.",
      "A trader with a high win rate can still lose money if losses are very large.",
      "Turtle Analytics reviews risk/reward alongside expectancy, profit factor, drawdown, average win, average loss, risk per trade, holding time, and journal notes.",
      "Risk/reward does not guarantee profitability. It must be read with win rate, execution quality, sample size, slippage, market conditions, and whether trades followed the original plan.",
    ],
    topics: [
      "Risk/reward ratio",
      "Reward risk ratio",
      "Trading risk management",
      "Average win",
      "Average loss",
      "Trading expectancy",
      "Win rate",
      "Payoff ratio",
      "Turtle Analytics",
    ],
    extraGraph: [
      {
        "@type": "Article",
        headline: "Risk/Reward Ratio in Trading Explained",
        url: `${siteUrl}/risk-reward-ratio-trading`,
        datePublished: "2026-08-20",
        dateModified: "2026-08-20",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        about: [
          "Risk/reward ratio",
          "Trading risk management",
          "Trading expectancy",
          "Average win",
          "Average loss",
          "Turtle Analytics",
        ],
        description:
          "An educational guide explaining risk/reward ratio in trading, planned risk, realised average win/loss, win rate, expectancy, and trading discipline.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is risk/reward ratio in trading?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Risk/reward ratio compares the amount a trader risks with the amount they are trying to make on a trade.",
            },
          },
          {
            "@type": "Question",
            name: "How do you calculate risk/reward ratio?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A common calculation is potential reward divided by amount risked. For closed trades, traders can also review average win size divided by average loss size.",
            },
          },
          {
            "@type": "Question",
            name: "Is 2:1 risk/reward always good?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. A 2:1 setup still depends on win rate, execution quality, costs, slippage, and whether the trader follows the plan.",
            },
          },
          {
            "@type": "Question",
            name: "Can a low risk/reward strategy be profitable?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. A lower risk/reward strategy can be profitable if the win rate is high enough and losses are controlled.",
            },
          },
          {
            "@type": "Question",
            name: "Is risk/reward the same as profit factor?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Risk/reward compares risk and reward per trade or average trade. Profit factor compares total gross profit with total gross loss.",
            },
          },
          {
            "@type": "Question",
            name: "Does risk/reward guarantee returns?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Risk/reward is a planning and review metric. It does not guarantee future returns or remove market risk.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/trader-verification-guide",
    title: "Trader Verification Guide | Green Turtle Trades",
    description:
      "Trader verification guide explaining verified trading records, data sources, screenshots, public summaries, private raw data, risk metrics, and Green Turtle Trades methodology.",
    keywords:
      "trader verification guide, verify trader performance, verified trading records, trader performance verification, verified traders, Green Turtle Trades methodology",
    h1: "Trader Verification Guide",
    headline: "How to understand verified trader records, data sources, public summaries, and risk metrics.",
    paragraphs: [
      "Trader verification should make performance harder to misunderstand.",
      "A strong verification workflow explains where the data came from, which metrics were calculated, what is public, what stays private, and what the limits of the record are.",
      "Screenshots can be cropped, selective, or missing context. A useful verification process should rely on platform-recorded activity, connected account data, imported history, or in-house execution records where possible.",
      "Verified does not mean risk-free. It means a trading record is supported by a stated data source.",
      "Public pages should label whether data is live platform data, imported broker history, MetaTrader-connected history, journal records, or competition execution data.",
      "Raw trades, account details, and private journal notes should not automatically be public. Public profiles can show controlled summaries such as return, win rate, profit factor, expectancy, drawdown, risk labels, and trade count.",
      "Useful verification metrics include realised return, unrealised return, total return, win rate, expectancy, profit factor, drawdown, risk per trade, average hold time, sample size, exposure, and consistency.",
      "Verification should be strict about duplicate trades, missing identifiers, stale marks, incomplete exits, and mismatched account totals.",
      "Verification does not guarantee future performance, remove trading risk, or mean a trader is suitable for every investor.",
    ],
    topics: [
      "Trader verification",
      "Verified trading records",
      "Verified trader performance",
      "Trading analytics methodology",
      "Public performance summaries",
      "Private trade data",
      "Risk metrics",
      "Green Turtle Trades methodology",
    ],
    extraGraph: [
      {
        "@type": "TechArticle",
        headline: "Trader Verification Guide",
        url: `${siteUrl}/trader-verification-guide`,
        datePublished: "2026-08-20",
        dateModified: "2026-08-20",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        about: [
          "Trader verification",
          "Verified trading records",
          "Trading analytics",
          "Risk metrics",
          "Performance methodology",
        ],
        description:
          "A guide explaining trader verification, data sources, public summaries, private raw data, risk metrics, duplicate handling, and Green Turtle Trades methodology.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is trader verification?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Trader verification is the process of supporting a trading record with clear data sources, calculation rules, and controlled performance summaries.",
            },
          },
          {
            "@type": "Question",
            name: "Why are screenshots not enough to verify a trader?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Screenshots can be selective or missing context. Verification is stronger when it uses platform-recorded activity, connected account data, or imported account history.",
            },
          },
          {
            "@type": "Question",
            name: "Does verified mean a trader is safe?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Verified means the record is supported by stated data. It does not mean the trader is risk-free or guaranteed to perform in the future.",
            },
          },
          {
            "@type": "Question",
            name: "Do verified traders need to publish raw trades?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Not necessarily. Public profiles can show controlled summary metrics while raw trades, account details, and private journal notes remain private.",
            },
          },
          {
            "@type": "Question",
            name: "Which metrics matter for trader verification?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Important metrics include realised and unrealised return, win rate, expectancy, profit factor, drawdown, risk per trade, average hold time, trade count, sample size, exposure, and consistency.",
            },
          },
          {
            "@type": "Question",
            name: "Where can I read the Green Turtle Trades methodology?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The public methodology is available at https://greenturtletraders.co.uk/methodology.",
            },
          },
        ],
      },
    ],
  }),
  page({
    route: "/mt4-mt5-trading-journal",
    title: "MT4 and MT5 Trading Journal | Green Turtle Trades",
    description:
      "An MT4 and MT5 trading journal for turning MetaTrader account history into structured notes, performance analytics, expectancy, drawdown, and risk review.",
    keywords:
      "MT4 trading journal, MT5 trading journal, MetaTrader trading journal, MetaTrader analytics, MT4 analytics, MT5 analytics, MetaTrader performance tracker, MT5 trade journal",
    h1: "MT4 and MT5 Trading Journal",
    headline: "Turn MetaTrader account history into journal records, analytics, and risk review.",
    paragraphs: [
      "MetaTrader account history shows what happened, but it rarely explains why it happened. Green Turtle Trades supports MetaTrader-connected workflows so MT4 and MT5 traders can turn trading history into journal records, analytics dashboards, risk review, and clearer performance feedback.",
      "A MetaTrader trading journal should bring account history into a structured review process. Instead of only seeing tickets and account history rows, traders should be able to review symbol, direction, entry, exit, lot size, holding time, risk, result, notes, and lessons in one place.",
      "MetaTrader account history is useful for raw execution records, but it does not usually provide the full decision context. A trading journal adds setup notes, trade rationale, exit quality, recurring mistakes, emotional triggers, risk behaviour, and whether a trade followed the plan.",
      "Turtle Analytics can use MetaTrader-connected history to review win rate, expectancy, profit factor, average win, average loss, R-multiple, drawdown, risk per trade, average holding time, best and worst trades, and performance patterns across a trader's own historical record.",
      "A strong MT4 or MT5 journal should make risk visible. Traders can review position sizing, leverage where available, drawdown, open exposure, largest loss, stop-loss behaviour, and whether risk stayed consistent across different market conditions.",
      "MetaTrader-connected data can support private analytics and optional public summary performance. Raw trade records, account details, and private notes remain private by default, while public summaries should use controlled metrics and clearly labelled methodology.",
    ],
    topics: [
      "MT4 trading journal",
      "MT5 trading journal",
      "MetaTrader analytics",
      "MetaTrader performance tracker",
      "Trading journal",
      "Expectancy",
      "Drawdown",
      "Risk per trade",
      "Profit factor",
    ],
    extraGraph: [
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is an MT4 trading journal?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "An MT4 trading journal is a structured record of MetaTrader 4 trade history, notes, risk, holding time, decision context, and performance metrics.",
            },
          },
          {
            "@type": "Question",
            name: "What is an MT5 trading journal?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "An MT5 trading journal helps MetaTrader 5 traders review account history through notes, analytics, risk metrics, expectancy, drawdown, and performance dashboards.",
            },
          },
          {
            "@type": "Question",
            name: "How is a trading journal different from MetaTrader account history?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "MetaTrader account history records executions and balances. A trading journal adds context, notes, lessons, risk review, strategy review, and performance analytics.",
            },
          },
          {
            "@type": "Question",
            name: "Which MetaTrader metrics matter most?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Useful MetaTrader journal metrics include expectancy, win rate, profit factor, average win, average loss, R-multiple, drawdown, risk per trade, average hold time, best trade, worst trade, and sample size.",
            },
          },
          {
            "@type": "Question",
            name: "Does a MetaTrader journal predict market prices?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. A MetaTrader journal reviews historical trades and risk behaviour. It does not predict market prices or guarantee future returns.",
            },
          },
        ],
      },
    ],
  }),
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function replaceTag(html, pattern, replacement) {
  if (!pattern.test(html)) {
    throw new Error(`Unable to replace expected tag: ${pattern}`);
  }
  return html.replace(pattern, replacement);
}

function buildRouteHtml(baseHtml, pageConfig) {
  let html = baseHtml;

  html = replaceTag(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeAttribute(pageConfig.description)}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+name="keywords"\s+content="[^"]*"\s*\/>/,
    `<meta name="keywords" content="${escapeAttribute(pageConfig.keywords)}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${escapeAttribute(pageConfig.ogTitle)}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escapeAttribute(pageConfig.ogDescription)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>\s*/g,
    "",
  );
  html = html.replace(
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/>\s*/g,
    "",
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${pageConfig.canonical}" />
    <meta property="og:image" content="${socialImageUrl}" />
    <meta property="og:image:alt" content="Green Turtle Trades logo" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>\s*/g,
    "",
  );
  html = html.replace(
    /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/>\s*/g,
    "",
  );
  html = replaceTag(
    html,
    /<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${socialImageUrl}" />
    <meta name="twitter:image:alt" content="Green Turtle Trades logo" />`,
  );
  html = replaceTag(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${pageConfig.canonical}" />`,
  );
  html = replaceTag(
    html,
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(pageConfig.title)}</title>`,
  );
  html = replaceTag(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(pageConfig.structuredData, null, 6)}\n    </script>`,
  );
  html = replaceTag(
    html,
    /<main class="seo-fallback">[\s\S]*?<\/main>/,
    pageConfig.fallback,
  );

  return html;
}

if (!fs.existsSync(indexPath)) {
  throw new Error(`Build index.html not found at ${indexPath}`);
}

const indexHtml = fs.readFileSync(indexPath, "utf8");

for (const pageConfig of pages) {
  const routeHtml = buildRouteHtml(indexHtml, pageConfig);
  fs.mkdirSync(path.dirname(pageConfig.outputPath), { recursive: true });
  fs.writeFileSync(pageConfig.outputPath, routeHtml);
  console.log(`Generated ${path.relative(buildDir, pageConfig.outputPath)}`);
}
