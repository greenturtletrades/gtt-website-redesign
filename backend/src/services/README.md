# Services

This folder contains shared backend helpers that are not route modules.

- `email.js` wraps transactional email sending
- `file-storage.js` uploads applicant files to the private S3-compatible bucket and signs short-lived download links
- `application-forms.js` validates the trader application and investor enquiry forms and checks uploaded file contents
- `html.js` escapes user text before it goes into email HTML
- `account-state.js` builds trader/admin account state payloads
- `billing-referrals.js` contains billing and referral helper logic shared across routes
