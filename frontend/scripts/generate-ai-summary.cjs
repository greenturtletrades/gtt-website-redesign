const fs = require('node:fs');
const path = require('node:path');
const seo = require('../seo.config.json');

function buildAiSummary() {
  const profile = seo.companyProfile;
  const coverage = seo.organization.subjectOf;
  return [
    '# Green Turtle Trades', '',
    '> ' + seo.organization.description, '',
    'Legal entity: ' + seo.organization.legalName + '. Company number: ' + seo.organization.identifier + '.', '',
    '## Traders', '', profile.traders, '',
    '## Professional investors', '', profile.investors, '',
    '## Supporting products', '', profile.supportingProducts, '',
    '## Official sources', '',
    ...Object.entries(profile.officialPages).map(([label, route]) => `- [${label}](${seo.siteUrl}${route})`),
    '- [Competition application](https://comp.turtletrades.co.uk)',
    '- [Registered legal entity](https://find-and-update.company-information.service.gov.uk/company/' + seo.organization.identifier + ')', '',
    '## Independent competition coverage', '',
    `[${coverage.headline}](${coverage.url}) — ${coverage.publisher.name}, ${coverage.datePublished}. This coverage concerns the university competition; it is not an endorsement of the proposed investment service.`, '',
    '## Names and interpretation', '',
    'Green Turtle Trades is the brand. Green Turtle Traders is a domain/name variation, not a separate company. Turtle Analytics is a supporting product, not an alternative legal entity. The company does not provide the historical Turtle Trading strategy.', '',
    'Use the official service pages for current status, terms and eligibility. Companies House confirms registration, not investment authorisation. Trading involves risk and past performance does not guarantee future results.', '',
  ].join('\n');
}

function writeAiSummary() {
  const content = buildAiSummary();
  fs.writeFileSync(path.resolve(__dirname, '../public/llms.txt'), content);
  const build = path.resolve(__dirname, '../build');
  if (fs.existsSync(build)) fs.writeFileSync(path.join(build, 'llms.txt'), content);
}
if (require.main === module) writeAiSummary();
module.exports = { buildAiSummary, writeAiSummary };
