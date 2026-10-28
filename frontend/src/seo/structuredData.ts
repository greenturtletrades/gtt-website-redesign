import seo from "../../seo.config.json";
import content from "../../seo-content.json";
import editorial from "../../page-copy.json";
import { getCanonicalUrl, type ViewType } from "./routes";

export function buildStructuredData(view: ViewType) {
  const canonical = getCanonicalUrl(view);
  const route = new URL(canonical).pathname;
  const metadata = (seo.routes as Record<string, { title: string; description: string; audience?: string }>)[route] || seo.routes["/"];
  const page = content.pages.find(page => page.route === route);
  const copy = (editorial as Record<string, { title: string }>)[route];
  const graph: Record<string, unknown>[] = [seo.organization, seo.website, {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Green Turtle Trades", item: seo.siteUrl + "/" },
      ...(route === "/" ? [] : [{ "@type": "ListItem", position: 2, name: page?.title || copy?.title || metadata.title, item: canonical }]),
    ],
  }];
  if (page?.faqs.length) graph.push({
    "@type": "FAQPage",
    mainEntity: page.faqs.map(faq => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  });
  graph.push({
    "@type": route === "/about" ? "AboutPage" : "WebPage",
    "@id": canonical + "#webpage",
    url: canonical,
    name: metadata.title,
    description: metadata.description,
    ...(metadata.audience ? { audience: { "@type": "Audience", audienceType: metadata.audience } } : {}),
    isPartOf: { "@id": seo.website["@id"] },
    publisher: { "@id": seo.organization["@id"] },
  });
  return { "@context": "https://schema.org", "@graph": graph };
}
