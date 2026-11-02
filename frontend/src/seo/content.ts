import type { ViewType } from "./routes";
import content from "../../seo-content.json";

export type SeoContentPage = {
  view: ViewType;
  title: string;
  eyebrow: string;
  description: string;
  keywords: string;
  intro: string;
  sections: Array<{
    title: string;
    body: string;
    flow?: Array<{ title: string; body: string }>;
    responsibilities?: Array<{ title: string; body: string }>;
    comparison?: Array<{ topic: string; retail: string; gtt: string }>;
    links?: Array<{ label: string; href: string }>;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const seoContentPages = content.pages as SeoContentPage[];

export function getSeoContentPage(view: ViewType) {
  return seoContentPages.find((page) => page.view === view) || null;
}
