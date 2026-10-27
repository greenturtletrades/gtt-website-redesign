# Frontend build notes

Status as of 20 Oct 2026. What was built from the design plan, where it lives, and what still needs doing.

## Pages

| Page | Address | File |
| --- | --- | --- |
| Homepage | `/` | `frontend/src/components/marketing/LandingPage.tsx`, `Hero.tsx`, `HomeSections.tsx` |
| For Traders | `/traders` | `frontend/src/components/marketing/TradersPage.tsx` |
| Trader application | `/traders/apply` | `frontend/src/components/marketing/TraderApplicationPage.tsx` |
| Professional Investors | `/professional-investors` | `frontend/src/components/marketing/ProfessionalInvestorsPage.tsx` |
| Investor enquiry | `/professional-investors/enquire` | `frontend/src/components/marketing/InvestorEnquiryPage.tsx` |
| FAQs | `/faqs` | `frontend/src/components/marketing/FaqsPage.tsx` |

Analytics, Competition, About, Contact and the legal pages are unchanged.

## Shared building blocks

| File | Contains |
| --- | --- |
| `frontend/src/components/marketing/PageBlocks.tsx` | Page wrapper, notice banner, *Proposed* badge, section heading, step timeline, check list, route card, FAQ accordion, call-to-action band |
| `frontend/src/components/forms/FormControls.tsx` | Text, textarea with character counter, select, choice chips (single or multiple), checkbox, drag-and-drop file upload with type and size checks |
| `frontend/src/components/forms/countries.ts` | Country list (UK first, names from the browser) |
| `frontend/src/styles/gtt-pages.css` | All styles for the new pages, built on `home-brand.css` colours |
| `frontend/src/featureFlags.ts` | `VITE_INVESTOR_PAGE_LIVE` and `VITE_FORMS_DEMO` |

The site's Tailwind CSS is precompiled, so new Tailwind classes don't work. New styles go in `gtt-pages.css` as
plain classes.

## Other changes

- **Header:** For Traders, For Investors, Analytics, Competition and the existing Login menu. The mobile menu lists
  the two audience links first.
- **Footer:** For Traders, For Professional Investors and FAQs added to Quick Links.
- **Routes and redirects:** `frontend/src/seo/routes.ts` (in-app) and `frontend/public/_redirects` (server, 301).
- **SEO:** titles and descriptions in `frontend/src/seo/metadata.ts`. `/traders` and `/faqs` are pre-rendered by
  `frontend/scripts/generate-seo-pages.cjs` and listed in `frontend/public/sitemap.xml`. The investor pages are left
  out until the host signs off.
- **API helpers:** `frontend/src/api/traderApplication.ts` (multipart), `frontend/src/api/investorEnquiry.ts`, and
  `apiPostForm` in `frontend/src/api/client.ts`.
- **Removed:** `HomeNextSteps.tsx` (old "Invest. Trade. Grow." section) and `onboarding/TraderApplicationForm.tsx`
  (old form). The homepage no longer shows the phone walkthrough or the Our Values section, because both described
  the old virtual-capital model. The files are still in the repo if you want them back.

## Feature flags

| Variable | Effect |
| --- | --- |
| `VITE_INVESTOR_PAGE_LIVE=true` | Shows the investor page, its nav and footer links, its homepage button and route card, and the investor FAQs. Unset in production until host sign-off. Always on in local dev. |
| `VITE_FORMS_DEMO=true` | Local dev only. Forms skip the API and go straight to their confirmation screens. |

## Running it locally

```bash
cd frontend
npm install                          # first time only
VITE_FORMS_DEMO=true npm run dev     # preview with demo forms
npm run build                        # production build + SEO pages
```

## Still to do

1. **Replace placeholder copy.** Draft 2 wasn't available, so these are written as placeholders:
   - homepage hero paragraph and status text
   - For Traders introduction and the five copy steps
   - Professional Investors introduction, FCA eligibility wording and the four questions
   - all FAQs page answers
2. **Backend.** Built (see `02-backend-build-guide.md`). Forms work for real once the bucket and variables are set
   up and `TRADER_APPLICATIONS_OPEN=true`; until then the trader form shows "applications are not open yet".
3. **Admin dashboard.** Detail view for the new application fields, file download buttons, and an investor enquiries
   tab. See section 8 of the backend guide.
4. **Manual testing.** Click through both forms at phone and desktop width:
   - missing fields show inline errors and move focus to the first one
   - a wrong file type and a file over the limit are both rejected
   - refreshing mid-application keeps typed answers and asks you to re-attach files
5. **Old SEO landing pages.** Review the 20 pages against the new positioning (open question in the design plan).
