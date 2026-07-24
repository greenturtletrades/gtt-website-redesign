const fs = require("fs");
const path = require("path");

const buildDir = path.resolve(__dirname, "..", "build");
const indexPath = path.join(buildDir, "index.html");
const siteUrl = "https://greenturtletraders.co.uk";

const organizationStructuredData = {
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
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
  url: siteUrl,
  logo: `${siteUrl}/favicon-v2.png`,
  email: "contact@greenturtletraders.co.uk",
  description:
    "Green Turtle Trades is a UK trading analytics and trader-backed investing platform operated by Green Turtle Trades Limited, company number SC878660.",
  sameAs: [
    "https://www.instagram.com/greenturtletrades/",
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
    `${siteUrl}/trading-analytics`,
    `${siteUrl}/trading-journal`,
    `${siteUrl}/verified-traders`,
    `${siteUrl}/turtle-analytics`,
    `${siteUrl}/traders-leaderboard`,
  ],
};

function page({
  route,
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
  const canonical = `${siteUrl}${route}`;
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
        {
          "@type": schemaType,
          name: h1,
          headline,
          url: canonical,
          description,
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
              <li><a href="/turtle-analytics">Turtle Analytics</a></li>
              <li><a href="/traders-leaderboard">Uni Competition</a></li>
              <li><a href="/trading-analytics">Trading Analytics</a></li>
              <li><a href="/trading-journal">Trading Journal</a></li>
              <li><a href="/verified-traders">Verified Traders</a></li>
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
      "The platform focuses on trading analytics, trader verification, trading journal workflows, and transparent performance records through Turtle Analytics and the public traders leaderboard.",
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
    title: "Trading Analytics and Trading Journal | Turtle Analytics",
    description:
      "Use Turtle Analytics as a trading analytics platform and trading journal to review performance, risk control, expectancy, trade history, and improvement opportunities.",
    keywords:
      "trading analytics, trading journal, trade journal, turtle analytics, trading performance analysis, trading analytics platform",
    h1: "Turtle Analytics",
    paragraphs: [
      "Turtle Analytics helps traders turn trade history into structured insight across expectancy, risk, win rate, drawdown, trade timing, and journal records.",
      "The product is designed for traders who want clearer performance analysis, better risk review, and a stronger private trading journal workflow.",
    ],
    topics: ["Trading analytics", "Trading journal", "Trade history analysis", "Risk control"],
    schemaType: "SoftwareApplication",
    extraGraph: [
      {
        "@type": "SoftwareApplication",
        name: "Turtle Analytics",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: `${siteUrl}/turtle-analytics`,
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
      },
    ],
  }),
  page({
    route: "/traders-leaderboard",
    title: "University Trading Competition | Green Turtle Trades",
    description:
      "Join the Green Turtle Trades university trading competition with demo capital, in-house market execution, university leaderboards, and skill-based rankings.",
    keywords:
      "university trading competition, student trading competition, trading leaderboard, Green Turtle Trades competition, demo trading competition, university traders",
    h1: "University Trading Competition",
    paragraphs: [
      "The Green Turtle Trades university trading competition lets verified student accounts compete with demo capital through the in-house market execution engine.",
      "Competition leaderboards reward win rate, expectancy, completed trade sample, and risk control rather than one-off screenshots or unsupported claims.",
    ],
    topics: ["University trading competition", "Student trader leaderboard", "Demo trading competition"],
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
  }),
  page({
    route: "/trading-analytics",
    title: "Trading Analytics | Green Turtle Trades",
    description:
      "Trading analytics helps traders review performance, risk control, expectancy, trade timing, and historical trade behaviour with clear data.",
    keywords:
      "trading analytics, trading performance analytics, trading analytics platform, trade analytics, trading performance analysis",
    h1: "Trading Analytics",
    paragraphs: [
      "Trading analytics helps traders review trade history, risk, expectancy, win rate, drawdown, and behaviour patterns.",
      "Green Turtle Trades turns trade history into structured insight so traders can understand where performance is strong, where risk is too high, and which behaviours need attention.",
    ],
    topics: ["Trading analytics", "Trading performance analysis", "Risk analytics"],
  }),
  page({
    route: "/trading-journal",
    title: "Trading Journal | Green Turtle Trades",
    description:
      "A trading journal for recording trades, reviewing performance, tracking lessons, and understanding risk across your trading history.",
    keywords:
      "trading journal, trade journal, forex trading journal, trading journal app, trading performance journal",
    h1: "Trading Journal",
    paragraphs: [
      "A trading journal helps traders turn trade history into feedback by recording notes, lessons, decisions, outcomes, and risk.",
      "Green Turtle Trades connects journal records with Turtle Analytics so traders can move from simple record keeping to deeper performance analysis.",
    ],
    topics: ["Trading journal", "Trade journal", "Trader performance records"],
  }),
  page({
    route: "/verified-traders",
    title: "Verified Traders | Green Turtle Trades",
    description:
      "Green Turtle Trades focuses on verified traders, transparent performance data, risk control, and investor trust.",
    keywords:
      "verified traders, verified trading performance, transparent traders, trader verification, professional traders",
    h1: "Verified Traders",
    paragraphs: [
      "Verified trader data matters because trust cannot be built from screenshots alone.",
      "Green Turtle Trades is designed around transparent performance records, risk controls, and trader accountability.",
    ],
    topics: ["Verified traders", "Trader verification", "Trading transparency"],
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
      "Track trading performance with metrics such as win rate, expectancy, R-multiple, risk per trade, drawdown, and trade history.",
    keywords:
      "trading performance tracker, trading performance, trade tracker, trading metrics, track trading performance",
    h1: "Trading Performance Tracker",
    paragraphs: [
      "A trading performance tracker helps traders understand whether results are consistent, risk-aware, and repeatable.",
      "Green Turtle Trades combines performance tracking with journal and analytics workflows.",
    ],
    topics: ["Trading performance tracker", "Trading metrics", "Trade tracking"],
  }),
  page({
    route: "/trading-risk-management",
    title: "Trading Risk Management | Green Turtle Trades",
    description:
      "Trading risk management tools and analytics for reviewing risk per trade, drawdown, expectancy, and trader consistency.",
    keywords:
      "trading risk management, risk management trading, trading risk analytics, risk per trade, trading drawdown",
    h1: "Trading Risk Management",
    paragraphs: [
      "Risk management is central to serious trading.",
      "Green Turtle Trades helps traders review risk per trade, drawdown behaviour, expectancy, and performance consistency.",
    ],
    topics: ["Trading risk management", "Risk per trade", "Drawdown analytics"],
  }),
  page({
    route: "/mt4-mt5-trading-journal",
    title: "MT4 and MT5 Trading Journal | Green Turtle Trades",
    description:
      "A trading journal and analytics workflow for MetaTrader 4 and MetaTrader 5 traders who want clearer performance records.",
    keywords:
      "MT4 trading journal, MT5 trading journal, MetaTrader trading journal, MetaTrader analytics, MT4 analytics, MT5 analytics",
    h1: "MT4 and MT5 Trading Journal",
    paragraphs: [
      "MetaTrader traders need a clear way to turn account history into performance feedback.",
      "Green Turtle Trades supports MetaTrader-connected workflows for journal records, analytics, and optional public summary performance.",
    ],
    topics: ["MT4 trading journal", "MT5 trading journal", "MetaTrader analytics"],
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
  html = replaceTag(
    html,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${pageConfig.canonical}" />`,
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
