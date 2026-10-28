const assert = require('node:assert/strict');
const { createSeoServer } = require('./serve-seo.cjs');
const seo = require('../seo.config.json');
(async () => {
  const server = createSeoServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of Object.keys(seo.routes)) {
      const res = await fetch(base + route); assert.equal(res.status, 200, route);
      if (route !== '/') { const slash = await fetch(base + route + '/?source=test', { redirect: 'manual' }); assert.equal(slash.status, 301); assert.equal(slash.headers.get('location'), route + '?source=test'); }
      const head = await fetch(base + route, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
    }
    const summary = await fetch(base + '/llms.txt'); assert.equal(summary.status, 200); assert.match(summary.headers.get('content-type'), /text\/plain/); assert.equal(await summary.text(), require('./generate-ai-summary.cjs').buildAiSummary());
    for (const route of Object.keys(seo.routes)) {
      if (route === '/') continue;
      const directIndex = await fetch(base + route + '/index.html?source=test', { redirect: 'manual' });
      assert.equal(directIndex.status, 301, route+' direct HTML alias');
      assert.equal(directIndex.headers.get('location'), route+'?source=test');
    }
    const malformed = await fetch(base + '/%E0%A4%A'); assert.equal(malformed.status, 400);
    const stillAlive = await fetch(base + '/health'); assert.equal(stillAlive.status, 200);
    const alias = await fetch(base + '/index.html?source=test', { redirect: 'manual' }); assert.equal(alias.status, 301); assert.equal(alias.headers.get('location'), '/?source=test');
    const missing = await fetch(base + '/seo-check-missing'); assert.equal(missing.status, 404); assert.match(missing.headers.get('x-robots-tag'), /noindex/);
    const admin = await fetch(base + '/admin'); assert.equal(admin.status, 200); assert.match(admin.headers.get('x-robots-tag'), /noindex/);
    for (const [from, to] of require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../public/_redirects'), 'utf8').split('\n').map(l => l.split(/\s+/)).filter(p => p[2] === '301')) {
      const res = await fetch(base + from, { redirect: 'manual' }); assert.equal(res.status, 301, from); assert.equal(res.headers.get('location'), to);
    }
    console.log('HTTP checks passed: route HTML, aliases, trailing slashes, query preservation, HEAD, 404 and private indexing.');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
