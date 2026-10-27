// The Professional Investors page is a financial promotion: it stays hidden in
// production until VITE_INVESTOR_PAGE_LIVE is "true". Local dev always shows it.
export const isInvestorPageLive =
  import.meta.env.DEV || import.meta.env.VITE_INVESTOR_PAGE_LIVE === "true";

// Local-only preview mode: forms show their confirmation screen without calling the API.
export const isFormsDemo = import.meta.env.DEV && import.meta.env.VITE_FORMS_DEMO === "true";
