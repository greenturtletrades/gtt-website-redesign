import { buildStructuredData } from "./structuredData";
import { getCanonicalUrl, type ViewType } from "./routes";

type SeoMetadata = {
  title: string;
  description: string;
  keywords?: string;
};

const defaultMetadata: SeoMetadata = {
  title: "Green Turtle Trades | Trading Analytics and Trader Leaderboard",
  description:
    "Green Turtle Trades helps traders analyze performance, manage risk, and publish verified summary performance on the public Turtle Traders leaderboard.",
  keywords:
    "green turtle trades, trading analytics, trader leaderboard, traders leaderboard, trading performance",
};

const pageMetadata: Partial<Record<ViewType, SeoMetadata>> = {
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
  const metadata = pageMetadata[view] || defaultMetadata;
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
