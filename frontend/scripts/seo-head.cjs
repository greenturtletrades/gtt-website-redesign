const seo = require('../seo.config.json');
const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function applyHead(html, route, originalGraph = []) {
  const metadata = seo.routes[route];
  if (!metadata) throw new Error(`Missing SEO metadata for ${route}`);
  const canonical = seo.siteUrl + route;
  const graph = [seo.organization, seo.website, ...originalGraph.filter(node =>
    !['Organization', 'WebSite', 'WebPage', 'AboutPage', 'CollectionPage'].includes(node['@type']) &&
    (node['@type'] !== 'WebApplication' || route === '/university-competition') &&
    (node['@type'] !== 'ProfilePage' || route === '/green-turtle-trades') &&
    (node['@type'] !== 'FAQPage' || !seo.omitLegacyFaqSchemaRoutes.includes(route)))];
  graph.push({ '@type': route === '/about' ? 'AboutPage' : 'WebPage', '@id': canonical + '#webpage',
    url: canonical, name: metadata.title, description: metadata.description,
    ...(metadata.audience ? { audience: { '@type': 'Audience', audienceType: metadata.audience } } : {}),
    isPartOf: { '@id': seo.website['@id'] }, publisher: { '@id': seo.organization['@id'] } });
  // Work only inside <head>; page text and layout are deliberately preserved.
  return html.replace(/<head>([\s\S]*?)<\/head>/, (_, head) => {
    head = head.replace(/<title>[\s\S]*?<\/title>/g, '')
      .replace(/<meta\b[^>]*(?:name|property)="(?:description|keywords|robots|og:title|og:description|og:url|twitter:title|twitter:description)"[^>]*>\s*/g, '')
      .replace(/<link\b[^>]*rel="canonical"[^>]*>\s*/g, '')
      .replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g, '');
    head = head.replace(/[ \t]+\n/g, "\n");
    const tags = [
      `<title>${escape(metadata.title)}</title>`,
      `<meta name="description" content="${escape(metadata.description)}" />`,
      `<meta name="robots" content="${metadata.robots || 'index, follow'}" />`,
      `<link rel="canonical" href="${escape(canonical)}" />`,
      `<meta property="og:title" content="${escape(metadata.title)}" />`,
      `<meta property="og:description" content="${escape(metadata.description)}" />`,
      `<meta property="og:url" content="${escape(canonical)}" />`,
      `<meta name="twitter:title" content="${escape(metadata.title)}" />`,
      `<meta name="twitter:description" content="${escape(metadata.description)}" />`,
      `<script id="gtt-structured-data" type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`,
    ];
    return `<head>${head}\n    ${tags.join('\n    ')}\n  </head>`;
  });
}
module.exports = { applyHead };
