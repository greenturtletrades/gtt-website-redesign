import seo from "../../seo.config.json";

export const MEASUREMENT_ID = "G-Y3WJ7KXW9V";
export const CONSENT_KEY = "gtt-analytics-consent-v1";
export const CONSENT_EVENT = "gtt-analytics-consent-change";
export type AnalyticsConsent = "accepted" | "rejected";
const consentLifetime = 180 * 24 * 60 * 60 * 1000;
const excludedPaths = new Set(["/contact", "/turtle-analytics"]);
const publicPaths = new Set(seo.indexableRoutes.filter(path => !excludedPaths.has(path)));
const analyticsWindow = window as Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean;
};
let initialised = false;
let guarded = false;
let paused = false;
let sessionConsent: { choice: AnalyticsConsent; expires: number } | null = null;
const leadDefinitions = {
  investor_enquiry: { event: "investor_enquiry_submitted", path: "/professional-investors/enquire", title: "Investor enquiry completed" },
  trader_application: { event: "trader_application_submitted", path: "/traders/apply", title: "Trader application completed" },
} as const;
type LeadType = keyof typeof leadDefinitions;
let confirmationPath: string | null = null;
const recordedSubmissions = new Set<string>();

export function readAnalyticsConsent(): AnalyticsConsent | null {
  try {
    const saved = sessionConsent || JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
    if (saved && ["accepted", "rejected"].includes(saved.choice) &&
        Number.isFinite(saved.expires) && saved.expires > Date.now()) return saved.choice;
  } catch { /* Analytics stays off when a preference cannot be read. */ }
  return null;
}

export function isAnalyticsPage(url: URL) {
  return url.origin === window.location.origin && publicPaths.has(url.pathname) && !url.search;
}

function canMeasure(url = new URL(window.location.href)) {
  return import.meta.env.PROD && ["greenturtletraders.co.uk", "www.greenturtletraders.co.uk"].includes(window.location.hostname) &&
    !paused && readAnalyticsConsent() === "accepted" && (isAnalyticsPage(url) ||
      (url.origin === window.location.origin && url.pathname === confirmationPath && !url.search));
}

function setDisabled(disabled: boolean) {
  analyticsWindow[`ga-disable-${MEASUREMENT_ID}`] = disabled;
}

export function syncAnalytics() {
  const enabled = canMeasure();
  setDisabled(!enabled);
  if (!enabled || initialised) return;
  initialised = true;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.gtag = function () { analyticsWindow.dataLayer!.push(arguments); };
  const gtag = analyticsWindow.gtag;
  gtag("consent", "default", {
    analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
  });
  gtag("consent", "update", { analytics_storage: "granted" });
  gtag("js", new Date());
  let referrer = "";
  try { referrer = document.referrer ? new URL(document.referrer).origin + "/" : ""; } catch { /* No referrer. */ }
  gtag("config", MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_referrer: referrer,
    cookie_expires: 60 * 60 * 24 * 180,
  });
  const script = document.createElement("script");
  script.id = "gtt-google-analytics";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function setAnalyticsPaused(value: boolean) {
  paused = value;
  syncAnalytics();
}

// Called only after a real server acknowledgement and after React removes all form fields.
export function trackLeadSuccess(type: LeadType, submissionId: string) {
  const definition = leadDefinitions[type];
  const url = new URL(window.location.href);
  if (!definition || typeof submissionId !== "string" || !submissionId.trim() ||
      url.pathname !== definition.path || url.search || document.querySelector("input, select, textarea")) return false;
  confirmationPath = definition.path;
  const key = `${type}:${submissionId}`;
  if (!canMeasure() || recordedSubmissions.has(key)) return false;
  try {
    syncAnalytics();
    if (!analyticsWindow.gtag) return false;
    recordedSubmissions.add(key);
    analyticsWindow.gtag("event", definition.event, {
      send_to: MEASUREMENT_ID,
      lead_type: type,
      page_location: window.location.origin + definition.path,
      page_title: definition.title,
    });
    return true;
  } catch { return false; } // Measurement must never interrupt a successful submission.
}

function clearAnalyticsCookies() {
  const domains = ["", window.location.hostname, "." + window.location.hostname];
  const parts = window.location.hostname.split(".");
  while (parts.length > 2) { parts.shift(); domains.push("." + parts.join(".")); }
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0];
    if (!/^_ga(?:_|$)/.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/;${domain ? ` domain=${domain};` : ""} SameSite=Lax`;
    }
  }
}

export function saveAnalyticsConsent(choice: AnalyticsConsent) {
  // Disable first, including when the tag has already loaded during this visit.
  setDisabled(true);
  sessionConsent = { choice, expires: Date.now() + consentLifetime };
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(sessionConsent)); } catch { /* The choice still applies for this visit. */ }
  analyticsWindow.gtag?.("consent", "update", { analytics_storage: choice === "accepted" ? "granted" : "denied" });
  if (choice === "rejected") clearAnalyticsCookies();
  syncAnalytics();
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function initialiseAnalyticsGuard() {
  if (guarded) return;
  guarded = true;
  setDisabled(true);
  // Run before gtag's history listeners, so excluded routes cannot send automatic events.
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (data, unused, url) => {
      let enabled = false;
      try {
        const destination = new URL(url == null ? window.location.href : String(url), window.location.href);
        if (destination.href !== window.location.href) confirmationPath = null;
        enabled = canMeasure(destination);
      } catch { /* Invalid destinations remain unmeasured. */ }
      setDisabled(!enabled);
      return original(data, unused, url);
    };
  }
  window.addEventListener("popstate", () => { confirmationPath = null; setDisabled(!canMeasure()); }, true);
  window.addEventListener("storage", event => {
    if (event.key === CONSENT_KEY || event.key === null) {
      sessionConsent = null;
      syncAnalytics();
      if (readAnalyticsConsent() !== "accepted") clearAnalyticsCookies();
      window.dispatchEvent(new Event(CONSENT_EVENT));
    }
  });
}
