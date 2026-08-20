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
  | "seo-trading-education"
  | "seo-trading-journal"
  | "seo-verified-traders"
  | "seo-investor-capital"
  | "seo-trader-marketplace"
  | "seo-copy-trading-platform"
  | "seo-trader-funding"
  | "seo-prop-firm-alternative"
  | "seo-trading-performance-tracker"
  | "seo-trading-risk-management"
  | "seo-trading-expectancy"
  | "seo-trading-drawdown"
  | "seo-profit-factor-trading"
  | "seo-risk-reward-ratio-trading"
  | "seo-trader-verification-guide"
  | "seo-mt4-mt5-trading-journal"
  | "seo-methodology"
  | "seo-investment-competition"
  | "seo-student-investing-competition"
  | "seo-virtual-trading-competition"
  | "seo-green-turtle-trades"
  | "admin-dashboard"
  | "trader-application"
  | "trader-application-status";

export const SITE_URL = "https://greenturtletraders.co.uk";

export const viewPaths: Partial<Record<ViewType, string>> = {
  landing: "/",
  about: "/about",
  "turtle-analytics": "/turtle-analytics",
  "turtle-traders": "/university-competition",
  terms: "/terms",
  privacy: "/privacy",
  "risk-disclosure": "/risk-disclosure",
  contact: "/contact",
  "seo-trading-analytics": "/trading-analytics",
  "seo-trading-education": "/trading-education",
  "seo-trading-journal": "/trading-journal",
  "seo-verified-traders": "/verified-traders",
  "seo-investor-capital": "/investor-capital-for-traders",
  "seo-trader-marketplace": "/trader-marketplace",
  "seo-copy-trading-platform": "/copy-trading-platform",
  "seo-trader-funding": "/trader-funding",
  "seo-prop-firm-alternative": "/prop-firm-alternative",
  "seo-trading-performance-tracker": "/trading-performance-tracker",
  "seo-trading-risk-management": "/trading-risk-management",
  "seo-trading-expectancy": "/trading-expectancy",
  "seo-trading-drawdown": "/trading-drawdown",
  "seo-profit-factor-trading": "/profit-factor-trading",
  "seo-risk-reward-ratio-trading": "/risk-reward-ratio-trading",
  "seo-trader-verification-guide": "/trader-verification-guide",
  "seo-mt4-mt5-trading-journal": "/mt4-mt5-trading-journal",
  "seo-methodology": "/methodology",
  "seo-investment-competition": "/investment-competition",
  "seo-student-investing-competition": "/student-investing-competition",
  "seo-virtual-trading-competition": "/virtual-trading-competition",
  "seo-green-turtle-trades": "/green-turtle-trades",
  "trader-application": "/trader-application",
  "trader-application-status": "/trader-application-status",
};

const canonicalViewPaths: Partial<Record<ViewType, string>> = {
  "seo-investment-competition": "/university-competition",
  "seo-student-investing-competition": "/university-competition",
  "seo-virtual-trading-competition": "/university-competition",
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
    normalizedPath === "/what-is-green-turtle-traders" ||
    normalizedPath === "/traders-leaderboard"
  ) {
    if (normalizedPath === "/about-us") return "about";
    if (normalizedPath === "/traders-leaderboard") return "turtle-traders";
    return "seo-green-turtle-trades";
  }

  const match = Object.entries(viewPaths).find(([, path]) => path === normalizedPath);
  return (match?.[0] as ViewType | undefined) || "landing";
}

export function getPathForView(view: ViewType): string {
  return viewPaths[view] || "/";
}

export function getCanonicalUrl(view: ViewType): string {
  const path = canonicalViewPaths[view] || getPathForView(view);
  return `${SITE_URL}${path === "/" ? "" : path}`;
}
