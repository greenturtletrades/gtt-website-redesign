// The Professional Investors page is a financial promotion. It is shown by default;
// set VITE_INVESTOR_PAGE_LIVE to "false" (and redeploy) to hide it and its links.
export const isInvestorPageLive = import.meta.env.VITE_INVESTOR_PAGE_LIVE !== "false";

// Local-only preview mode: forms show their confirmation screen without calling the API.
export const isFormsDemo = import.meta.env.DEV && import.meta.env.VITE_FORMS_DEMO === "true";
