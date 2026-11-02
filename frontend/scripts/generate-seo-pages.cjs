const fs = require("node:fs");
const path = require("node:path");
const seo = require("../seo.config.json");
const content = require("../seo-content.json");
const editorial = require("../page-copy.json");
const { applyHead } = require("./seo-head.cjs");
const buildDir = path.resolve(__dirname, "../build");
const indexPath = path.join(buildDir, "index.html");
const escape = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildFallback(route) {
  const page = content.pages.find(page => page.route === route);
  const copy = editorial[route];
  const metadata = seo.routes[route];
  const title = page?.title || copy?.title || metadata.title;
  const paragraphs = page ? [page.intro] : copy?.paragraphs || [metadata.description];
  const sections = page?.sections || copy?.sections || [];
  const faqs = page?.faqs || [];
  const links = Object.entries(seo.companyProfile.officialPages)
    .filter(([, target]) => seo.routes[target])
    .map(([label, target]) => `<li><a href="${escape(target)}">${escape(label)}</a></li>`).join("\n");
  return `<main class="seo-fallback"><section><h1>${escape(title)}</h1>${paragraphs.map(text => `<p>${escape(text)}</p>`).join("\n")}</section>
${sections.map(section => `<section><h2>${escape(section.title)}</h2><p>${escape(section.body)}</p>
${section.flow ? `<ol>${section.flow.map(step => `<li><h3>${escape(step.title)}</h3><p>${escape(step.body)}</p></li>`).join("")}</ol>` : ""}
${(section.responsibilities || []).map(role => `<article><h3>${escape(role.title)}</h3><p>${escape(role.body)}</p></article>`).join("")}
${section.comparison ? `<table><caption>How the proposed GTT model compares</caption><thead><tr><th scope="col">Feature</th><th scope="col">Retail copy trading*</th><th scope="col">Proposed GTT model</th></tr></thead><tbody>${section.comparison.map(row => `<tr><th scope="row">${escape(row.topic)}</th><td>${escape(row.retail)}</td><td>${escape(row.gtt)}</td></tr>`).join("")}</tbody></table><p>*An illustrative comparison. Retail platforms vary in eligibility, discretion, account structure and risk controls; check each provider’s actual terms.</p>` : ""}
${(section.links || []).map(link => `<p><a href="${escape(link.href)}">${escape(link.label)}</a>${link.description ? ` — ${escape(link.description)}` : ""}</p>`).join("")}</section>`).join("\n")}
${faqs.map(faq => `<section><h2>${escape(faq.question)}</h2><p>${escape(faq.answer)}</p></section>`).join("\n")}
<section><h2>Green Turtle Trades pages</h2><ul>${links}</ul></section></main>`;
}

function writePages() {
  const baseHtml = fs.readFileSync(indexPath, "utf8");
  for (const route of Object.keys(seo.routes)) {
    const page = content.pages.find(page => page.route === route);
    const graph = [{ "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Green Turtle Trades", item: seo.siteUrl + "/" },
      ...(route === "/" ? [] : [{ "@type": "ListItem", position: 2, name: page?.title || editorial[route]?.title || seo.routes[route].title, item: seo.siteUrl + route }]),
    ] }];
    if (page?.faqs.length) graph.push({ "@type": "FAQPage", mainEntity: page.faqs.map(faq => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) });
    const body = baseHtml.replace(/<main class="seo-fallback">[\s\S]*?<\/main>/, buildFallback(route));
    const html = applyHead(body, route, graph);
    const target = path.join(buildDir, route.slice(1), "index.html");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html);
    console.log(`Generated ${path.relative(buildDir, target)}`);
  }
  const urls = seo.indexableRoutes.filter(route => !seo.routes[route]?.robots?.includes("noindex"));
  fs.writeFileSync(path.join(buildDir, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(route => '  <url><loc>' + seo.siteUrl + route + '</loc></url>').join('\n') + '\n</urlset>\n');
  require("./generate-ai-summary.cjs").writeAiSummary();
}
if (require.main === module) writePages();
module.exports = { buildFallback, writePages };
