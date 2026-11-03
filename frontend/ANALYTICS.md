# Website measurement

GA4 web stream: `G-Y3WJ7KXW9V`, supplied by the user on 3 November 2026.

The Google tag is appended to the document head once after an explicit analytics acceptance. There is no Google script request before acceptance or after a stored rejection. Basic consent defaults deny analytics and all advertising purposes; acceptance grants only analytics storage. Google signals and personalised advertising remain disabled. Choices last up to 180 days and can be changed from Cookie settings in the marketing footer or the privacy page. After acceptance or rejection, the banner closes and no floating settings button remains. Reopening the controls and closing them returns keyboard focus to the original footer or privacy-page button. Rejection disables further collection and clears accessible `_ga` cookies. A storage failure preserves the choice for the current visit.

Only production builds on `greenturtletraders.co.uk` and its `www` hostname can load the tag. Local previews and development builds never send Analytics data. Measurement is limited to configured indexable public routes, excluding Contact and Turtle Analytics (which share form/account functionality). Applications, investor enquiry forms, admin, unknown paths, URLs with query strings and authenticated/modal screens are excluded. A guard runs before Google’s history listeners; excluded routes are disabled before the History API changes the URL. No application fields, uploaded documents, user identifiers or account information are passed to Analytics by this integration. The initial referrer is reduced to its origin.

## Google Analytics settings

Keep Enhanced measurement page views and **Page changes based on browser history events** enabled in this web stream. Google handles route page views; the site does not send additional manual page views. Do not install a second tag through Tag Manager or another integration. For a minimal measurement setup, disable automatic form interactions and site search in the stream; successful lead events can be added separately with fixed, non-personal parameters.

After deployment, accept analytics in a fresh browser session and check the homepage, investor and trader journeys in GA4 Realtime or DebugView. A visitor who rejects analytics is intentionally absent from these reports. Installation detection tools may not see the Google tag until analytics is accepted. Successful application/enquiry conversion events are not part of this initial tag installation.

## Verification

`npm run check:analytics` exercises the actual TypeScript guard, including consent order, one script, public and private routes, sensitive query strings, withdrawal, cookie clearing, persistence, blocked storage and cross-tab changes. Run `npm run build` and `npm run check:seo` alongside it. Browser checks should cover the banner on desktop/mobile and outgoing Google requests with consent granted, declined and withdrawn. Test collection requests should be intercepted so development checks do not pollute the production property.

References: [Google consent setup](https://developers.google.com/tag-platform/security/guides/consent), [Google Analytics privacy controls](https://developers.google.com/tag-platform/security/guides/privacy), [SPA page views](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications).
