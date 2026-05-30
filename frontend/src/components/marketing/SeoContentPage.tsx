import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck } from "lucide-react";
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
    ["Trading Analytics", "seo-trading-analytics"],
    ["Trading Journal", "seo-trading-journal"],
    ["Verified Traders", "seo-verified-traders"],
    ["Trader Funding", "seo-trader-funding"],
    ["Traders Leaderboard", "turtle-traders"],
  ];

  return (
    <div className="min-h-screen bg-white pt-20 text-slate-950">
      <section className="w-full border-b border-slate-200 bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-teal-300">
              {page.eyebrow}
            </div>
            <h1 className="max-w-4xl text-4xl leading-tight tracking-tight sm:text-5xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {page.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate("turtle-analytics")}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-teal-400"
              >
                Open Analytics
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate("turtle-traders")}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-teal-300 hover:text-teal-200"
              >
                View Leaderboard
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Platform focus</div>
                <div className="mt-1 text-xl">Performance evidence</div>
              </div>
              <BarChart3 className="h-8 w-8 text-teal-300" />
            </div>
            <div className="grid gap-3">
              {[
                "Verified trade history",
                "Private journal analytics",
                "Risk-aware public metrics",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg bg-slate-800 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-teal-300" />
                  <span className="text-sm text-slate-200">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-white p-4 text-slate-950">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                Built for trust
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Summary performance can be public, while raw trade records and sensitive account details stay private.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h2 className="text-xl text-slate-950">{section.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
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
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
              Related topics
            </div>
            <h2 className="mt-2 text-3xl text-slate-950">Keep exploring</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {relatedPages.map(([label, relatedView]) => (
              <button
                key={relatedView}
                type="button"
                onClick={() => onNavigate(relatedView)}
                className="flex min-h-24 items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left text-sm text-slate-700 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
              >
                <span>{label}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-lg border border-teal-200 bg-teal-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl text-slate-950">Explore Green Turtle Trades</h2>
            <p className="mt-2 text-sm text-slate-700">
              Review the public traders leaderboard or open Turtle Analytics to see the platform in context.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate("turtle-traders")}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white transition-colors hover:bg-teal-700"
            >
              Traders Leaderboard
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
