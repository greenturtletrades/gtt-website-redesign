import { buildStructuredData } from "./structuredData";
import { getSeoContentPage } from "./content";
import { SITE_URL, getCanonicalUrl, type ViewType } from "./routes";

type SeoMetadata = {
  title: string;
  description: string;
  keywords?: string;
};

const defaultMetadata: SeoMetadata = {
  title: "Green Turtle Trades | Trading Analytics & Verified Trader Platform",
  description:
    "Green Turtle Trades provides trading analytics, trader journals, verified performance tools, and a Scottish university investment competition.",
  keywords:
    "green turtle trades, green turtle traders, trading analytics, trading journal, investment competition, trading competition, student investing competition, university competition leaderboard, trader rankings, trading performance",
};

const socialImageUrl = `${SITE_URL}/favicon-v2.png`;

const pageMetadata: Partial<Record<ViewType, SeoMetadata>> = {
  landing: {
    title: "Green Turtle Trades | Trading Analytics & Verified Trader Platform",
    description:
      "Green Turtle Trades is a UK trading analytics platform with trader journals, verified performance tools, public trader rankings, and a Scottish university investment competition.",
    keywords:
      "green turtle trades, green turtle traders, trading analytics platform, trading journal, investment competition, university investment competition, student investing competition, trader rankings, verified traders, trader marketplace",
  },
  about: {
    title: "About Green Turtle Trades | UK Trader-Backed Investing Platform",
    description:
      "About Green Turtle Trades: a UK trader-backed investing platform for fintech investment, copy trading, trader marketplace, and prop firm alternative searches.",
    keywords:
      "about Green Turtle Trades, trader-backed investing platform, fintech investment platform, copy trading platform, trader marketplace, prop firm alternative, verified trader platform, trader performance verification, trading transparency, Turtle Analytics",
  },
  "turtle-traders": {
    title: "University Investment Competition Leaderboard Scotland | Green Turtle Trades",
    description:
      "Scotland's next generation of investors, ranked live. Follow the Green Turtle Trades University Investment Competition with Scottish university rankings, student trader scores, returns, win rate, risk, backers, and competition activity.",
    keywords:
      "Scotland's next generation of investors, next generation investors Scotland, university investment competition, Scottish university investment competition, student investing competition Scotland, university competition leaderboard, student trader leaderboard, Scottish university trading competition, Green Turtle Trades competition, risk free investing competition, virtual trading competition",
  },
  "turtle-analytics": {
    title: "Turtle Analytics by Green Turtle Trades | Trading Analytics & Journal",
    description:
      "Use Turtle Analytics as a trading journal and trading analytics platform for MT4, MT5, Trading 212, CSV history, expectancy, drawdown, risk review, and trader performance tracking.",
    keywords:
      "Turtle Analytics, trading journal, trading analytics, MT4 trading journal, MT5 trading journal, trading performance tracker, expectancy, drawdown analysis, trading risk management",
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
            ? "Green Turtle Trades | UK Trading Analytics Platform"
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
  setMetaProperty("og:image", socialImageUrl);
  setMetaProperty("og:image:alt", "Green Turtle Trades logo");

  setMetaName("twitter:card", "summary_large_image");
  setMetaName("twitter:title", metadata.title);
  setMetaName("twitter:description", metadata.description);
  setMetaName("twitter:image", socialImageUrl);
  setMetaName("twitter:image:alt", "Green Turtle Trades logo");

  const googleSiteVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined;
  if (googleSiteVerification) {
    setMetaName("google-site-verification", googleSiteVerification);
  }

  setStructuredData(view);
}
