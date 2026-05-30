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

  return (
    <div className="min-h-screen bg-white pt-20">
      <section className="w-full bg-gradient-to-br from-teal-50 via-cyan-50 to-white px-4 py-16 text-slate-950 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
            {page.eyebrow}
          </div>
          <h1 className="max-w-4xl text-4xl leading-tight tracking-tight text-slate-950 sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-700 sm:text-lg">
            {page.intro}
          </p>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {page.sections.map((section) => (
            <article key={section.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl text-slate-950">{section.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-5xl">
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
        <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-lg border border-teal-200 bg-teal-50 p-6 sm:flex-row sm:items-center sm:justify-between">
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
