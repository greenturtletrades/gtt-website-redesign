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
