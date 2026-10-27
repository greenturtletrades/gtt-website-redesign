# GTT Website Design Plan

13 Oct 2026 · @Toni

This plan turns *Website Plan Draft 2* into build-ready pages: a product-overview homepage, a For Traders page with a
CV and records application, and a Professional Investors page with an enquiry form. Analytics and Competition stay
as they are. Estimated build: 3–4 working days with Claude coding, in four phases.

## Site map

The two new audience pages each lead to a form. Analytics and Competition keep their current addresses and content.

## Navigation and addresses

The main header changes from Home / Turtle Analytics / University Competition to four links: **For Traders, For
Investors, Analytics, Competition**. The logo returns to the homepage. About, Contact, FAQs, Privacy, Terms and Risk
Disclosure move to the footer.

| Page | Address | Change | Main button |
| --- | --- | --- | --- |
| Homepage | `/` | Rewritten as product overview | For Investors · For Traders |
| For Traders | `/traders` | New | Apply as a trader |
| Trader application | `/traders/apply` | New (replaces the removed form) | Submit application |
| Professional Investors | `/professional-investors` | New | Enquire about access |
| Investor enquiry | `/professional-investors/enquire` | New | Send enquiry |
| Analytics | `/turtle-analytics` | Kept as is | Explore Turtle Analytics |
| Competition | `/university-competition` | Kept as is | View the competition |
| FAQs | `/faqs` | New, footer only | — |
| About, Contact, legal pages | unchanged | Footer only | — |

Redirects: `/trader-application` → `/traders/apply` (it currently points to `/`), `/investors` and `/for-investors` →
`/professional-investors`, `/for-traders` → `/traders`.

The 20 existing SEO landing pages (for example `/trader-funding`, `/investor-capital-for-traders`,
`/copy-trading-platform`, `/prop-firm-alternative`) stay live, but their wording needs a check against the new
positioning. Some describe the old funding model.

## Homepage

The homepage explains the product in one screen and then splits visitors into two equal routes. Detail lives on the
audience pages. The current Hero and Next Steps sections are replaced. The Analytics feature block and footer are
reused.

1. **Hero** (replaces Hero)
   - Heading: *Verified trading strategies for professional investors*
   - Paragraph: the draft's "Green Turtle Trades is developing a platform…" copy
   - Two buttons of equal size, side by side: For Investors (filled) and For Traders (outline). On mobile they
     stack, full width.
   - Small line under the buttons: *Investment service for professional clients only. In development.*
2. **How it works** (new): four numbered steps in a row, which become a vertical list on mobile.
   1. Trader verified: records and CV reviewed
   2. Authorised connection: trader keeps their own broker account
   3. Copied within limits: trades sized to each client mandate
   4. Ongoing reporting: positions reconciled and reported
3. **Choose your route** (new): two cards of equal weight.
   - For Investors: who it serves, three bullets (managed accounts, professional clients only, enquiry first), button.
   - For Traders: who it serves, three bullets (keep your broker, CV and live record, share of performance fees),
     button.
4. **Evidence and products** (reuses TurtleAnalyticsFeature): verification explanation, an Analytics preview
   labelled *Prototype screen*, and a competition link card.
5. **Status and contact** (new): status text from the draft, then both route buttons again and a Contact link.

Rules for the whole page: date every figure, label illustrative numbers, and state the professional-clients-only
restriction wherever the investment service is mentioned.

## For Traders page

The page answers three questions in order: how copying works, what we look for, and what to send. *Apply as a
trader* appears in the hero, after the requirements and at the bottom.

1. **Hero:** heading *Trade your strategy. Reach professional capital.*, the draft introduction, button *Apply as a
   trader*, and a line saying applying does not guarantee selection.
2. **How we obtain and copy trades:** the five steps from the draft (record review, authorised connection, trading
   as usual, controlled copying, monitoring) as a numbered vertical timeline. Step 4 says the strategy is reviewed
   and agreed before any client money is linked. The draft's internal note becomes that sentence and is not shown as
   a note.
3. **What we assess:** five requirement cards (12 months verifiable live history, an explainable strategy, risk and
   drawdown control, platform competence, communication and monitoring). A badge reads *Proposed, subject to host*.
4. **What to prepare:** a checklist of documents (CV, broker statement, trade export, balance and equity history),
   so applicants gather evidence before starting.
5. **Potential remuneration:** one short paragraph with the 60/40 split (12% / 8% of eligible profit at a 20% fee),
   marked *Proposed terms*.
6. **Review process:** four steps after submission (CV and evidence review, record verification, strategy call, host
   assessment and agreements).
7. **FAQ strip:** data privacy, demo and competition records, no passwords requested.
8. **Final call to action:** Apply as a trader.

## Trader application

The application is a four-step form with a progress bar: About you, Trading account, Evidence, Questions and
consent. A screen before step 1 lists the required documents. Progress is saved in the browser so a refresh does not
lose answers.

| Step | Field | Type | Required |
| --- | --- | --- | --- |
| 1 About you | Full name, email, country of residence | Text, email, country list | Yes |
| 1 About you | Telephone | Phone input | No |
| 1 About you | CV | Upload: PDF, DOC, DOCX, max 10 MB | Yes |
| 1 About you | LinkedIn or website | URL | No |
| 2 Trading account | Broker, platform | Text, dropdown (MT4, MT5, cTrader, other) | Yes |
| 2 Trading account | Markets traded | Multi-select (FX, indices, commodities, equities, crypto) | Yes |
| 2 Trading account | Style | Discretionary / automated / both | Yes |
| 2 Trading account | Live history start date, years of experience | Date, number | Yes |
| 2 Trading account | Approximate account equity | Range dropdown | Yes |
| 3 Evidence | Broker statement | Upload: PDF, max 20 MB | Yes |
| 3 Evidence | Trade history export | Upload: CSV or XLSX, max 20 MB | Yes |
| 3 Evidence | Verified record link (e.g. Myfxbook) | URL | No |
| 3 Evidence | Historical return, maximum drawdown, how calculated | Number, number, short text | Yes |
| 3 Evidence | Strategy, holding period, position sizing | Long text, dropdown, short text | Yes |
| 3 Evidence | Record type | Live / demo / competition | Yes |
| 4 Questions | Why GTT, your suitability, time you can commit | Long text, 600 characters each | Yes |
| 4 Consent | Record is accurate and I may share it; privacy notice read | Checkboxes | Yes |

Rules:

- Never ask for passwords, investor passwords or API keys. A note on step 3 says so.
- Files larger than the limit get a message pointing to a private large-file route (an emailed upload link).
- Demo and competition records are accepted but flagged separately in review.

**Confirmation screen and email:** *Thanks, we've received your application. We will review your CV and records,
verify your trading history and contact you within 10 working days if we'd like to discuss your strategy. Applying
does not guarantee selection, a contract or investor capital.*

The team receives an email with a link to the application in the admin dashboard.

## Professional Investors page

The page shows *For Investors* in the navigation and *Professional Investors* as its heading. A banner directly under
the heading reads *For professional clients only. The service is in development and subject to a regulated
arrangement.* *Enquire about access* appears in the hero, after the operating explanation and at the bottom.

1. **Hero:** the draft introduction and the Enquire about access button.
2. **Who can access the service:** what professional client status means under the FCA rules, and that a form
   checkbox or allocation size does not establish it.
3. **Your journey:** the five steps from the draft (enquiry, assessment, account and mandate, funding and activation,
   reporting and changes) as a horizontal stepper, vertical on mobile.
4. **Accounts and responsibilities:** a three-column graphic showing Client account (at the broker or custodian),
   Investment manager (the regulated host) and GTT (copying technology). Each column lists that party's
   responsibilities.
5. **Copying and risk:** how trades are sized and checked, why results can differ, and a highlighted risk box.
6. **Fees:** a table of the 1.25% management fee, 20% performance fee with high-water mark, and £10,000 minimum per
   trader. A toggle shows the amounts including VAT (1.50% / 24%). The section is marked *Proposed terms, subject to
   host*.
7. **Questions answered:** an accordion with the four questions from the draft.
8. **Final call to action:** Enquire about access, plus the current launch status.

This page is a financial promotion. It ships behind a feature flag and goes live only after the host signs off the
wording.

## Investor enquiry form

The enquiry is a single page with no uploads. It starts a conversation and does not establish eligibility.

| Field | Type | Required |
| --- | --- | --- |
| Full name, email | Text, email | Yes |
| Telephone | Phone input | No |
| Enquiring as | Individual / organisation | Yes |
| Organisation and role | Text (shown for organisations only) | Yes, if organisation |
| Country of residence or incorporation | Country list | Yes |
| Existing professional client classification | Yes / no / not sure | Yes |
| Indicative allocation | Range: under £50k, £50k–250k, £250k–1m, over £1m | Yes |
| Investment objectives | Short text | Yes |
| Intended timing | Within 3 months, 3–12 months, exploring | Yes |
| Message or question | Long text | No |
| Privacy notice acknowledgement | Checkbox | Yes |

**Confirmation screen and email:** *Thank you for your enquiry. A member of the GTT team will contact you to discuss
the service and next steps. Access depends on assessment and client categorisation by the regulated firm. This
enquiry does not establish eligibility.*

The team receives an email with all the details. Categorisation evidence and onboarding documents are collected later
through the private process, never through this form.

## Visual design

The new pages reuse the existing homepage brand system (`home-brand.css`), so nothing looks bolted on.

| Element | Current value | Use |
| --- | --- | --- |
| Primary teal | `#0d9488` | Buttons, step numbers, trader accents |
| Cyan | `#0891b2` | Gradient end, investor accents |
| Dark teal | `#0f766e` | Kickers, links, secondary button text |
| Ink | `#0f172a` | Headings and body text |
| Muted | `#475569` | Supporting text |
| Line | `#dcebea` | Card borders and dividers |
| Font | System sans-serif | Unchanged |
| Buttons | `.home-brand-button` (teal→cyan gradient, 48px tall, 8px radius) | All main actions; outline style for secondary |

New components:

- **Route card:** used on the homepage for each audience. Investor cards use cyan accents and trader cards use teal,
  so the two routes are told apart by colour as well as by text.
- **Step timeline:** numbered circles joined by a line. It runs horizontally on desktop and vertically on mobile.
- **Notice banner:** a pale amber band for professional-clients-only and *Proposed, subject to host* notices, so
  they are never mistaken for decoration.
- **Multi-step form:** progress bar, one step per screen, drag-and-drop upload fields that show file name and size,
  inline errors.

Mobile: 16px side margins, buttons full width under 640px, the header collapses into the existing menu with For
Traders and For Investors first. Text never smaller than 16px in forms, to stop iOS from zooming in.

## Technical changes

All changes are in the GTT-Landing-Page repo (`gtt-website-no-go` locally), which Railway deploys to
greenturtletraders.co.uk. Most of it is new pages. The one genuinely new piece of infrastructure is private file
storage for uploads.

**Frontend (`frontend/src`)**

- `seo/routes.ts`: add views and paths for traders, trader-apply, professional-investors and investor-enquire, plus
  the new redirects.
- `marketing/Header.tsx`: replace the three links with the four new ones, on both desktop and mobile.
- `marketing/LandingPage.tsx`: new section order. Hero is rewritten; new HowItWorks, RouteCards and StatusContact
  components.
- New pages: TradersPage, TraderApplicationPage (rebuilt from `onboarding/TraderApplicationForm.tsx`),
  ProfessionalInvestorsPage, InvestorEnquiryPage.
- `api/traderApplication.ts` updated for the new fields and uploads; new `api/investorEnquiry.ts`.
- `seo/metadata.ts`: titles and descriptions for the new pages.
- `Footer.tsx`: add FAQs and the secondary links.

**Backend (`backend/src`)**

- `POST /api/trader/apply` currently returns 403 with the note *Closed for FCA regulatory reasons*. It is reopened
  only once the host and team agree, controlled by a `TRADER_APPLICATIONS_OPEN` variable.
- The endpoint accepts multipart form data (adds the multer package). It checks file type by content as well as
  extension, enforces size limits and rate-limits by IP using the existing Redis.
- New `POST /api/investor/enquiry`, which validates and stores the enquiry and sends two emails through the existing
  Resend setup.
- Admin: the existing `/api/admin/trader-applications` list, approve and reject routes gain the new fields and a
  `GET …/:id/files/:fileId` that returns a 5-minute signed download link. A new `/api/admin/investor-enquiries` list
  is added.

**Database (Prisma)**

- `TraderApplication`: add phone, cvFileKey, linkedinUrl, platform options, markets, style, historyStartDate,
  equityRange, returnPct, maxDrawdownPct, calcMethod, strategy, holdingPeriod, sizingApproach, recordType, three
  answer fields and consent timestamps. The email `@unique` constraint is dropped so people can reapply.
- New `TraderApplicationFile` (applicationId, kind, storageKey, fileName, size, mimeType).
- New `InvestorEnquiry` model with the form fields plus status (new, contacted, closed).

**File storage**

- A private Railway bucket (S3-compatible), created in the landing-page project. Files are never public and are
  downloaded only through signed links from the admin dashboard.
- A retention rule, such as deleting rejected applicants' files after 12 months, needs agreeing and adding to the
  privacy notice.

**Feature flags (Railway variables):** `VITE_INVESTOR_PAGE_LIVE` hides the investor page and its navigation link
until it is approved. `TRADER_APPLICATIONS_OPEN` controls the application.

## Build phases

Each phase ships on its own, so the visible homepage change can go live first. Effort assumes Claude writes the code
and Toni reviews and tests. Alongside uni, at 2–3 hours a day, the whole build takes 1½–2 weeks.

| Phase | Ships | Effort | Blocked by |
| --- | --- | --- | --- |
| 1 Navigation and homepage | New header, homepage, redirects, footer | ½ day | Approval of homepage copy |
| 2 Traders page and application | `/traders`, `/traders/apply`, file storage, admin view | 1½–2 days | Decision to reopen applications; bucket set up |
| 3 Investors page and enquiry | `/professional-investors`, enquiry form and emails (behind flag) | 1 day | Host sign-off before the flag is turned on |
| 4 Checks and finishing | FAQs page, SEO metadata, mobile and desktop testing, deploy | ½ day | — |

Testing in each phase: each form is submitted with good and bad data, uploads are tried with the wrong type and with
oversize files, emails are checked to arrive, and the pages are checked on an iPhone-size and a desktop screen.

## Open questions

The first two block going live. The rest can use the defaults in this plan until they are answered.

- [x] Can trader applications reopen? The endpoint was closed for FCA reasons. What has changed, and does the host
  agree? **Yes, they can.**
- [ ] Who approves the Professional Investors page as a financial promotion, and when?
- [ ] Which email address receives trader applications and investor enquiries?
- [ ] Response time promised in the confirmation messages (the plan assumes 10 working days)
- [ ] Supported brokers and platforms to list (the plan assumes MT4 and MT5)
- [ ] How long CVs and statements are kept for applicants who are rejected (the plan assumes 12 months)
- [ ] Should the 20 SEO landing pages be rewritten, redirected or left as they are?
- [ ] Are fee figures shown publicly before host agreement, or replaced with *discussed on enquiry*?
- [ ] Brand colour: the draft says green accents, but the live site uses teal and cyan. The plan keeps teal and cyan.
