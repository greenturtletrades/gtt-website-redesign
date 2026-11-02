# Audience and search positioning

Updated 2 November 2026 in the redesign frontend. This work was prepared and checked locally; publishing was outside this change.

## Page responsibilities

| URL | Audience and purpose |
| --- | --- |
| `/` | Edinburgh company identity and entry points for professional investors and independent traders. |
| `/professional-investors` | Proposed alternative investment platform for UK professional clients: evidence, mandate journey, parties, risks, fees and enquiries. |
| `/alternative-investment-platform` | Explain the proposed alternative investment management process: strategy evidence, capacity, allocations, broker execution and host responsibilities. |
| `/traders` | Copy trading for independent MT4/MT5 traders: record review, approved source accounts, remuneration and applications. |
| `/copy-trading-platform` | Explain source connections, trade filters, allocation calculations, execution and trader approval. |
| `/professional-clients` | Explain client categories and assessment, referencing FCA Handbook COBS 3.5. |
| `/methodology` and `/trader-verification-guide` | Support due diligence with the records, metrics and limits of verification. |

The proposed investment service is for UK professional clients only. Trader onboarding is a separate process from investor categorisation. The platform is not yet available; trader onboarding and prospective professional client discussions are open.

GTT provides technology and trader review. Client capital and execution sit with the designated broker; investment management is intended to sit with the regulated host. Do not infer an account count, separate execution accounts for each investor, live investment availability or guaranteed allocations from the marketing descriptions.

## Shared sources

- `seo.config.json`: titles, descriptions, company schema, audiences, availability, indexable URLs and AI-summary inputs.
- `page-copy.json`: primary-page introductions and audience resource sections. React and generated route HTML read the same new resource content.
- `seo-content.json`: guide articles and FAQs, shared by React, generated HTML and FAQ schema.
- `src/components/marketing/AudienceResources.tsx`: existing-style guide cards with native internal links.

The initial homepage, route HTML, sitemap and `llms.txt` are generated or aligned with these sources. Keep the complete build output when deploying. Include the new component as well as modified files in any future commit.

## Validation

Production build and existing SEO/HTTP checks passed for 34 configured routes. Browser checks covered direct visits, initial/runtime metadata, a single schema graph, investor-to-guide navigation, trader-to-guide navigation, footer links and 1440px/390px layouts. Primary-page evidence summaries and resource links were also checked in generated HTML. The absent local backend prevents authenticated account-flow verification.

```sh
npm run build
npm run check:seo
npm run check:calculator
```

After publication, inspect the audience and guide URLs in Search Console and measure relevant non-brand impressions, visits and enquiries. This change establishes content targets; it does not establish rankings or measured search demand.

## Review before publishing

The 2 November review checked the investor and trader journeys against the original goal of clearer non-brand search positioning. The homepage introduces the Edinburgh company and both audiences; the investor page and alternative investment guide cover the proposed investment process; the trader page and copying guide cover source accounts, review and remuneration. Supporting verification guides link directly into those journeys, while analytics and the virtual competition remain separate products. This is a specialist trading-strategy proposition, not a claim to offer every category of alternative asset or to act as the investment manager.

The homepage search description now specifies trader onboarding rather than general onboarding. Its two explainer links retain the original stacked text-link styling at the user’s preference. The main audience calls to action use native links, and commercial guide calls to action use local paths so previews stay within the same version of the site. The general FAQ describes the intended host arrangement without presenting it as an established live service. No public ranking improvement has been measured by this local review.

## Trader fee-share illustration

Both fee sections include calculators as a third accordion row beneath the hurdle and high-water-mark explanations. The trader version has allocation and return inputs, one main fee-share result, and visible fixed hurdle/loss assumptions. The investor version retains all four controls and a full fee/return breakdown. Deep links open the relevant accordion; closing it preserves the current scenario. `fee-terms.json` supplies its management fee, marginal performance bands and trader shares, as well as both public fee tables. The 3.7% default hurdle is an editable planning example, not a live reference rate or final contractual benchmark.

Following the user’s fee clarification on 2 November 2026, management fees apply separately to total investor capital on the platform. Performance fees use eligible trading gains before the management fee, above the greater of the assumed hurdle and prior-loss recovery threshold. Only the final investor result deducts both charges, once each. The investor UI assumes the entered overall return applies across the full example platform balance. The calculation also supports different total platform capital and strategy allocations; tests verify that changing total platform capital changes only the management charge and final investor result, not the strategy’s performance fee or trader share. It assumes constant capital, one year-end calculation and returns after trading costs but before either charge. It excludes VAT, tax, intra-year return paths, quarterly provisional payments, retention and later reconciliation. It is not billing software or a payment forecast. Numerical checks cover boundaries and loss recovery, and final remuneration remains subject to agreement.
