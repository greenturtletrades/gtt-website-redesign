import seo from "../../seo.config.json";
import { buildStructuredData } from "./structuredData";
import { SITE_URL, getCanonicalUrl, type ViewType } from "./routes";

type SeoMetadata = {
  title: string;
  description: string;
  keywords?: string;
};

const defaultMetadata: SeoMetadata = seo.routes["/"];
const socialImageUrl = `${SITE_URL}/favicon-v2.png`;

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
  const canonicalUrl = getCanonicalUrl(view);
  const route = new URL(canonicalUrl).pathname;
  const configured = (seo.routes as Record<string, SeoMetadata & { robots?: string }>)[route];
  const metadata = configured || defaultMetadata;
  document.title = metadata.title;
  setMetaName("robots", view === "admin-dashboard" || view === "settings" || view === "ea-code" ? "noindex, follow" : configured?.robots || "index, follow");
  setMetaName("description", metadata.description);
  document.head.querySelectorAll('meta[name="keywords"]').forEach(element => element.remove());
  setCanonical(canonicalUrl);

  setMetaProperty("og:title", metadata.title);
  setMetaProperty("og:description", metadata.description);
  setMetaProperty("og:type", "website");
  setMetaProperty("og:url", canonicalUrl);
  setMetaProperty("og:site_name", "Green Turtle Trades");
  setMetaProperty("og:image", socialImageUrl);
  setMetaProperty("og:image:alt", "Green Turtle Trades logo");

  setMetaName("twitter:card", "summary");
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
