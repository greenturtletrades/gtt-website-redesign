const fs = require("fs");
const path = require("path");

const buildDir = path.resolve(__dirname, "..", "build");
const indexPath = path.join(buildDir, "index.html");
const siteUrl = "https://greenturtletraders.co.uk";

const aboutPage = {
  outputPath: path.join(buildDir, "about", "index.html"),
  title: "About Green Turtle Trades | UK Trader-Backed Investing Platform",
  description:
    "About Green Turtle Trades: four Edinburgh university students building the UK's most transparent platform for trader-backed investing, trader analytics, and performance verification.",
  keywords:
    "about Green Turtle Trades, Green Turtle Trades founders, Edinburgh trading platform, trader-backed investing, trading transparency, trader performance verification, Turtle Analytics",
  canonical: `${siteUrl}/about`,
  ogTitle: "About Green Turtle Trades | UK Trader-Backed Investing Platform",
  ogDescription:
    "Four Edinburgh university students building the UK's most transparent platform for trader-backed investing, trader analytics, and performance verification.",
  fallback: `
        <main class="seo-fallback">
          <section>
            <h1>About Green Turtle Trades</h1>
            <p>
              Green Turtle Trades was started by four university students based in Edinburgh after
              seeing more people pulled into trading propaganda, signal groups, and unverifiable
              performance claims.
            </p>
            <p>
              Green Turtle Trades is building the UK's most transparent platform for trader-backed
              investing by helping traders, investors, and evaluators review performance through
              trade history, risk, consistency, and public trader summaries.
            </p>
            <p>
              The platform focuses on trading analytics, trader verification, trading journal
              workflows, and transparent performance records through Turtle Analytics and the public
              traders leaderboard.
            </p>
          </section>
          <section>
            <h2>Key Green Turtle Trades pages</h2>
            <ul>
              <li><a href="/">Green Turtle Trades homepage</a></li>
              <li><a href="/about">About Green Turtle Trades</a></li>
              <li><a href="/turtle-analytics">Turtle Analytics</a></li>
              <li><a href="/traders-leaderboard">Traders Leaderboard</a></li>
              <li><a href="/green-turtle-trades">Green Turtle Trades company overview</a></li>
            </ul>
          </section>
        </main>`,
  structuredData: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Green Turtle Trades",
        alternateName: ["Green Turtle Traders", "Green Turtle Trades Limited", "Turtle Analytics"],
        legalName: "Green Turtle Trades Limited",
        identifier: "SC878660",
        url: siteUrl,
        mainEntityOfPage: `${siteUrl}/about`,
        logo: `${siteUrl}/favicon-v2.png`,
        email: "contact@greenturtletraders.co.uk",
        description:
          "Green Turtle Trades is a UK trading analytics and trader-backed investing platform operated by Green Turtle Trades Limited, company number SC878660.",
        address: {
          "@type": "PostalAddress",
          streetAddress: "5 South Charlotte Street",
          addressLocality: "Edinburgh",
          postalCode: "EH2 4AN",
          addressCountry: "GB",
        },
        sameAs: [
          "https://www.instagram.com/greenturtletrades/",
          "https://www.youtube.com/@GreenTurtleTrades",
          "https://find-and-update.company-information.service.gov.uk/company/SC878660",
        ],
      },
      {
        "@type": "AboutPage",
        name: "About Green Turtle Trades",
        headline: "Building the UK's most transparent platform for trader-backed investing",
        url: `${siteUrl}/about`,
        description:
          "About Green Turtle Trades, a UK trading analytics and trader-backed investing platform founded by four Edinburgh university students to make trader performance, risk, and investing decisions more transparent.",
        mainEntity: {
          "@id": `${siteUrl}/#organization`,
        },
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        about: [
          { "@type": "Thing", name: "Trader-backed investing" },
          { "@type": "Thing", name: "Trader performance transparency" },
          { "@type": "Thing", name: "Trading analytics" },
          { "@type": "Thing", name: "Edinburgh startup" },
        ],
      },
    ],
  },
};

function replaceTag(html, pattern, replacement) {
  if (!pattern.test(html)) {
    throw new Error(`Unable to replace expected tag: ${pattern}`);
  }
  return html.replace(pattern, replacement);
}

function buildRouteHtml(baseHtml, page) {
  let html = baseHtml;

  html = replaceTag(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${page.description}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+name="keywords"\s+content="[^"]*"\s*\/>/,
    `<meta name="keywords" content="${page.keywords}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${page.ogTitle}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${page.ogDescription}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${page.canonical}" />`,
  );
  html = replaceTag(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${page.canonical}" />`,
  );
  html = replaceTag(
    html,
    /<title>[\s\S]*?<\/title>/,
    `<title>${page.title}</title>`,
  );
  html = replaceTag(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(page.structuredData, null, 6)}\n    </script>`,
  );
  html = replaceTag(
    html,
    /<main class="seo-fallback">[\s\S]*?<\/main>/,
    page.fallback,
  );

  return html;
}

if (!fs.existsSync(indexPath)) {
  throw new Error(`Build index.html not found at ${indexPath}`);
}

const indexHtml = fs.readFileSync(indexPath, "utf8");
const aboutHtml = buildRouteHtml(indexHtml, aboutPage);

fs.mkdirSync(path.dirname(aboutPage.outputPath), { recursive: true });
fs.writeFileSync(aboutPage.outputPath, aboutHtml);

console.log(`Generated ${path.relative(buildDir, aboutPage.outputPath)}`);
