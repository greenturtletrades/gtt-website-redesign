# SEO deployment handover

These changes are intended for this repository's frontend. Keep the separate landing-page repository separate; do not deploy it over the newer redesign merely because both use the same canonical domain.

## Verify the commit

Include all required new files as well as modified tracked files. In particular, `seo.config.json`, `seo-content.json`, `page-copy.json`, `src/seo/NavigationLink.tsx` and the new files under `scripts/` are runtime/build inputs. A commit using only `git commit -am` will omit new files and break the deployment.

Generated `build/` output and `node_modules/` are ignored and should not be committed. The hosting build generates the production files.

## Reproduce the checks

From `frontend/`:

```sh
npm ci
npm run build
npm run check:seo
```

Verified using Node 20.20.0 and fresh installs from the checked-in lockfile. The SEO checks compare initial and runtime schema in full, verify visible article/FAQ parity, and check generated AI summaries. HTTP tests start a temporary local server and exercise redirects, query preservation, route HTML, indexing headers, malformed paths and missing pages. No external service credentials are needed for these checks.

## Railway frontend settings

Use the intended repository/branch and the `frontend` working directory. The build command is `npm ci && npm run build`. To adopt the included redirect-aware server, set the frontend start command explicitly to:

```sh
npm run start:seo
```

The server listens on Railway's `PORT`; `/health` returns 200. It serves the generated `build/` directory. It does not proxy or replace the backend API. Keep the production `VITE_API_BASE` and any existing competition/payment configuration. The API helper otherwise defaults to localhost, which is for local development.

The professional investor page is visible by default in the redesign. Check that a production environment variable is not setting `VITE_INVESTOR_PAGE_LIVE=false` if you intend to publish it. Preserve the intended product feature settings rather than enabling unfinished products for SEO.

For the primary public deployment, leave `SEO_NOINDEX` unset or set it to `false`. Set `SEO_NOINDEX=true` only when intentionally preventing a preview deployment from being indexed. This flag controls HTTP indexing headers in the included server; it does not change an unrelated hosting server.

If retaining a different production static server, implement equivalent alias/direct-index/trailing-slash redirects and genuine 404 responses there. A `_redirects` file alone does not establish that Railway's chosen server applies those rules.

## Verify after deployment

- Check `/`, `/traders`, `/professional-investors`, `/about` and `/green-turtle-trades` for the revised wording and matching initial metadata.
- Check `/investors`, `/for-traders`, `/traders/` and `/traders/index.html`: permanent redirects should reach the intended canonical route and preserve query parameters.
- Check a missing URL returns 404; verify `/llms.txt`, `/sitemap.xml`, styles and JavaScript still return the correct content types.
- Verify the public homepage has no `noindex` directive. Confirm that private/enquiry/application routes retain their intended indexing rules.
- Submit the sitemap and inspect the main audience URLs in Search Console after publication. External search/AI summaries need recrawling; local passing checks are not proof that external systems have updated.

DNS/TLS for the non-resolving `www` hostname and the `turtletrades.co.uk` apex error are separate hosting tasks, not changes made by this commit. Preserve the working competition subdomain.
