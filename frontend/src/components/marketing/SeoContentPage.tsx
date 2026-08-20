import { ArrowRight, BarChart3, CheckCircle2, LineChart, ShieldCheck } from "lucide-react";
import { Footer } from "./Footer";
import { getSeoContentPage } from "../../seo/content";
import type { ViewType } from "../../seo/routes";

interface SeoContentPageProps {
  view: ViewType;
  onNavigate: (view: ViewType) => void;
}

export function SeoContentPage({ view, onNavigate }: SeoContentPageProps) {
  const page = getSeoContentPage(view);

  if (!page) {
    return null;
  }

  const relatedPages: Array<[string, ViewType]> = [
    ["About Us", "about"],
    ["Green Turtle Trades", "seo-green-turtle-trades"],
    ["Trading Analytics", "seo-trading-analytics"],
    ["Trading Journal", "seo-trading-journal"],
    ["Trading Expectancy", "seo-trading-expectancy"],
    ["Verified Traders", "seo-verified-traders"],
    ["Methodology", "seo-methodology"],
    ["Trader Marketplace", "seo-trader-marketplace"],
    ["Copy Trading Platform", "seo-copy-trading-platform"],
    ["Trader Funding", "seo-trader-funding"],
    ["Prop Firm Alternative", "seo-prop-firm-alternative"],
    ["University Competition", "turtle-traders"],
  ];

  const featureIcons = [ShieldCheck, BarChart3, LineChart, CheckCircle2];

  return (
    <div className="min-h-screen bg-white pt-20 text-slate-950">
      <section className="w-full border-b border-slate-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
          <div className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
            {page.eyebrow}
          </div>
          <h1 className="max-w-4xl text-4xl leading-tight tracking-tight text-slate-950 sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-800">
            {page.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate("turtle-analytics")}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              Open Analytics
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("turtle-traders")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:border-teal-500 hover:text-teal-700"
            >
              View Leaderboard
            </button>
          </div>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-white/80 p-5 shadow-xl shadow-teal-900/10">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
              Built around
            </div>
            <div className="mt-5 grid gap-3">
              {page.sections.slice(0, 4).map((section, index) => {
                const Icon = featureIcons[index % featureIcons.length];
                return (
                  <div key={section.title} className="grid grid-cols-[auto_1fr] gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-950">{section.title}</div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {section.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {page.sections.map((section, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
            <article key={section.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-2xl text-slate-950">{section.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-slate-700">{section.body}</p>
            </article>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
              FAQ
            </div>
            <h2 className="mt-2 text-3xl text-slate-950">Common questions</h2>
          </div>
          <div className="grid gap-4">
            {page.faqs.map((faq) => (
              <article key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-lg text-slate-950">{faq.question}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-700">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
              Related topics
            </div>
            <h2 className="mt-2 text-3xl text-slate-950">Keep exploring</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedPages.map(([label, relatedView]) => (
              <button
                key={relatedView}
                type="button"
                onClick={() => onNavigate(relatedView)}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-medium text-slate-800 transition-colors hover:border-teal-500 hover:text-teal-700"
              >
                <span>{label}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl text-slate-950">Explore Green Turtle Trades</h2>
            <p className="mt-2 text-sm text-slate-700">
              Review the university competition leaderboard or open Turtle Analytics to see the platform in context.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate("turtle-traders")}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white transition-colors hover:bg-teal-700"
            >
              University Competition
            </button>
            <button
              type="button"
              onClick={() => onNavigate("turtle-analytics")}
              className="rounded-lg border border-teal-300 bg-white px-4 py-2 text-sm text-teal-700 transition-colors hover:bg-teal-50"
            >
              Trading Analytics
            </button>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
