export type ViewType =
  | "landing"
  | "about"
  | "turtle-analytics"
  | "turtle-traders"
  | "ea-code"
  | "settings"
  | "terms"
  | "privacy"
  | "risk-disclosure"
  | "contact"
  | "seo-trading-analytics"
  | "seo-trading-journal"
  | "seo-verified-traders"
  | "seo-investor-capital"
  | "seo-trader-marketplace"
  | "seo-copy-trading-platform"
  | "seo-trader-funding"
  | "seo-prop-firm-alternative"
  | "seo-trading-performance-tracker"
  | "seo-trading-risk-management"
  | "seo-mt4-mt5-trading-journal"
  | "seo-green-turtle-trades"
  | "admin-dashboard"
  | "trader-application"
  | "trader-application-status";

export const SITE_URL = "https://greenturtletraders.co.uk";

export const viewPaths: Partial<Record<ViewType, string>> = {
  landing: "/",
  about: "/about",
  "turtle-analytics": "/turtle-analytics",
  "turtle-traders": "/traders-leaderboard",
  terms: "/terms",
  privacy: "/privacy",
  "risk-disclosure": "/risk-disclosure",
  contact: "/contact",
  "seo-trading-analytics": "/trading-analytics",
  "seo-trading-journal": "/trading-journal",
  "seo-verified-traders": "/verified-traders",
  "seo-investor-capital": "/investor-capital-for-traders",
  "seo-trader-marketplace": "/trader-marketplace",
  "seo-copy-trading-platform": "/copy-trading-platform",
  "seo-trader-funding": "/trader-funding",
  "seo-prop-firm-alternative": "/prop-firm-alternative",
  "seo-trading-performance-tracker": "/trading-performance-tracker",
  "seo-trading-risk-management": "/trading-risk-management",
  "seo-mt4-mt5-trading-journal": "/mt4-mt5-trading-journal",
  "seo-green-turtle-trades": "/green-turtle-trades",
  "trader-application": "/trader-application",
  "trader-application-status": "/trader-application-status",
};

export function getViewFromPath(pathname: string): ViewType {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/admin") {
    return "admin-dashboard";
  }

  if (
    normalizedPath === "/about-us" ||
    normalizedPath === "/what-is-green-turtle-trades" ||
    normalizedPath === "/green-turtle-traders" ||
    normalizedPath === "/what-is-green-turtle-traders"
  ) {
    return normalizedPath === "/about-us" ? "about" : "seo-green-turtle-trades";
  }

  const match = Object.entries(viewPaths).find(([, path]) => path === normalizedPath);
  return (match?.[0] as ViewType | undefined) || "landing";
}

export function getPathForView(view: ViewType): string {
  return viewPaths[view] || "/";
}

export function getCanonicalUrl(view: ViewType): string {
  return `${SITE_URL}${getPathForView(view) === "/" ? "" : getPathForView(view)}`;
}
