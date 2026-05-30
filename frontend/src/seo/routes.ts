export type ViewType =
  | "landing"
  | "turtle-analytics"
  | "turtle-traders"
  | "ea-code"
  | "settings"
  | "terms"
  | "privacy"
  | "risk-disclosure"
  | "contact"
  | "admin-dashboard"
  | "trader-application"
  | "trader-application-status";

export const SITE_URL = "https://greenturtletraders.co.uk";

export const viewPaths: Partial<Record<ViewType, string>> = {
  landing: "/",
  "turtle-analytics": "/turtle-analytics",
  "turtle-traders": "/traders-leaderboard",
  terms: "/terms",
  privacy: "/privacy",
  "risk-disclosure": "/risk-disclosure",
  contact: "/contact",
  "trader-application": "/trader-application",
  "trader-application-status": "/trader-application-status",
};

export function getViewFromPath(pathname: string): ViewType {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/admin") {
    return "admin-dashboard";
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
