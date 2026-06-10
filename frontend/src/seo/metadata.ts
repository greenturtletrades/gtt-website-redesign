import { buildStructuredData } from "./structuredData";
import { getSeoContentPage } from "./content";
import { getCanonicalUrl, type ViewType } from "./routes";

type SeoMetadata = {
  title: string;
  description: string;
  keywords?: string;
};

const defaultMetadata: SeoMetadata = {
  title: "Green Turtle Trades | Verified Traders, Trading Analytics and Investor Capital",
  description:
    "Green Turtle Trades connects verified traders with investor capital and gives traders access to trading analytics, a trading journal, and a public traders leaderboard.",
  keywords:
    "green turtle trades, verified traders, trading analytics, trading journal, investor capital, traders leaderboard, trading performance",
};

const pageMetadata: Partial<Record<ViewType, SeoMetadata>> = {
  landing: {
    title: "Green Turtle Trades | Verified Traders and Trading Analytics Platform",
    description:
      "Green Turtle Trades is a trading platform for verified traders, investor capital, trading analytics, trading journal tools, and public trader performance transparency.",
    keywords:
      "green turtle trades, verified traders, trading platform, trading analytics, trading journal, investor capital, trader marketplace, traders leaderboard",
  },
  about: {
    title: "About Green Turtle Trades | UK Trader-Backed Investing Platform",
    description:
      "About Green Turtle Trades: a UK trader-backed investing platform for fintech investment, copy trading, trader marketplace, and prop firm alternative searches.",
    keywords:
      "about Green Turtle Trades, trader-backed investing platform, fintech investment platform, copy trading platform, trader marketplace, prop firm alternative, verified trader platform, trader performance verification, trading transparency, Turtle Analytics",
  },
  "turtle-traders": {
    title: "Traders Leaderboard | Green Turtle Trades",
    description:
      "View the Green Turtle Trades public traders leaderboard, ranked by verified account performance, win rate, expectancy, risk control, and trade history.",
    keywords:
      "traders leaderboard, public traders leaderboard, verified trading leaderboard, trading performance leaderboard, turtle traders leaderboard",
  },
  "turtle-analytics": {
    title: "Trading Analytics and Trading Journal | Turtle Analytics",
    description:
      "Use Turtle Analytics as a trading analytics platform and trading journal to review performance, risk control, expectancy, trade history, and improvement opportunities.",
    keywords:
      "trading analytics, trading journal, trade journal, turtle analytics, trading performance analysis, trading analytics platform",
  },
  contact: {
    title: "Contact Green Turtle Trades",
    description: "Contact Green Turtle Trades about trader analytics, public leaderboard listings, and platform support.",
  },
  privacy: {
    title: "Privacy Policy | Green Turtle Trades",
    description: "Read the Green Turtle Trades privacy policy.",
  },
  terms: {
    title: "Terms of Service | Green Turtle Trades",
    description: "Read the Green Turtle Trades terms of service.",
  },
  "risk-disclosure": {
    title: "Risk Disclosure | Green Turtle Trades",
    description: "Read the Green Turtle Trades trading risk disclosure.",
  },
};

function upsertMeta(selector: string, create: () => HTMLMetaElement | HTMLLinkElement) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  return element;
}

function setMetaName(name: string, content: string) {
  const element = upsertMeta(`meta[name="${name}"]`, () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", name);
    return meta;
  });
  element.setAttribute("content", content);
}

function setMetaProperty(property: string, content: string) {
  const element = upsertMeta(`meta[property="${property}"]`, () => {
    const meta = document.createElement("meta");
    meta.setAttribute("property", property);
    return meta;
  });
  element.setAttribute("content", content);
}

function setCanonical(url: string) {
  const element = upsertMeta(`link[rel="canonical"]`, () => {
    const link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    return link;
  });
  element.setAttribute("href", url);
}

function setStructuredData(view: ViewType) {
  const id = "gtt-structured-data";
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(buildStructuredData(view));
}

export function applySeoMetadata(view: ViewType) {
  const contentPage = getSeoContentPage(view);
  const metadata = contentPage
    ? {
        title:
          view === "seo-green-turtle-trades"
            ? "Green Turtle Trades | UK Trading Analytics and Verified Trader Platform"
            : `${contentPage.title} | Green Turtle Trades`,
        description: contentPage.description,
        keywords: contentPage.keywords,
      }
    : pageMetadata[view] || defaultMetadata;
  const canonicalUrl = getCanonicalUrl(view);

  document.title = metadata.title;
  setMetaName("description", metadata.description);
  if (metadata.keywords) {
    setMetaName("keywords", metadata.keywords);
  }
  setCanonical(canonicalUrl);

  setMetaProperty("og:title", metadata.title);
  setMetaProperty("og:description", metadata.description);
  setMetaProperty("og:type", "website");
  setMetaProperty("og:url", canonicalUrl);
  setMetaProperty("og:site_name", "Green Turtle Trades");

  setMetaName("twitter:card", "summary_large_image");
  setMetaName("twitter:title", metadata.title);
  setMetaName("twitter:description", metadata.description);

  setStructuredData(view);
}
