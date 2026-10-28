const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const seo = require('../seo.config.json');
const root = path.resolve(__dirname, '../build');
const redirects = new Map(fs.readFileSync(path.resolve(__dirname, '../public/_redirects'), 'utf8')
  .split('\n').map(line => line.trim().split(/\s+/)).filter(parts => parts[2] === '301' && !parts[0].includes('*')).map(([from, to]) => [from, to]));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webp': 'image/webp' };

function createSeoServer() {
  return http.createServer((req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (process.env.SEO_NOINDEX === 'true') res.setHeader('X-Robots-Tag', 'noindex, follow');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    let url, pathname;
    try { url = new URL(req.url, 'http://localhost'); pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
    if (pathname === '/health') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end(req.method === 'HEAD' ? undefined : 'ok'); }
    const normalized = pathname.replace(/\/+$/, '') || '/';
    const indexRoute = normalized.endsWith('/index.html') ? normalized.slice(0, -'/index.html'.length) || '/' : null;
    const target = (indexRoute && seo.routes[indexRoute] ? indexRoute : null) || redirects.get(normalized) || (pathname !== normalized && seo.routes[normalized] ? normalized : null);
    if (target) { res.writeHead(301, { Location: target + url.search }); return res.end(); }
    const requested = path.resolve(root, '.' + pathname);
    if (requested !== root && !requested.startsWith(root + path.sep)) { res.writeHead(404); return res.end(); }
    let file = requested;
    try { if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); } catch { /* handled below */ }
    let exists = false;
    try { exists = fs.statSync(file).isFile(); } catch { /* missing file */ }
    // Admin is a real client route. Unknown paths retain the existing shell but return a genuine 404.
    if (!exists) file = path.join(root, 'index.html');
    if (normalized === '/admin' || seo.routes[normalized]?.robots?.includes('noindex') || !exists) res.setHeader('X-Robots-Tag', 'noindex, follow');
    const status = exists || normalized === '/admin' ? 200 : 404;
    res.writeHead(status, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': exists && pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' });
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(file); stream.on('error', () => res.destroy()); stream.pipe(res);
  });
}
if (require.main === module) createSeoServer().listen(Number(process.env.PORT || 3000), '0.0.0.0');
module.exports = { createSeoServer };
