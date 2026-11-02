import { getPathForView, getViewFromPath } from "../../seo/routes";
import { ArrowRight, BarChart3, CheckCircle2, LineChart, ShieldCheck } from "lucide-react";
import { Footer } from "./Footer";
import { getSeoContentPage } from "../../seo/content";
import type { ViewType } from "../../seo/routes";
import "../../styles/seo-content.css";
import { NavigationLink } from "../../seo/NavigationLink";
import type { MouseEvent } from "react";
import seo from "../../../seo.config.json";

interface SeoContentPageProps {
  view: ViewType;
  onNavigate: (view: ViewType) => void;
}

export function SeoContentPage({ view, onNavigate }: SeoContentPageProps) {
  const page = getSeoContentPage(view);

  if (!page) {
    return null;
  }

  const commercial = ["seo-green-turtle-trades", "seo-investor-capital", "seo-trader-marketplace", "seo-copy-trading-platform", "seo-trader-funding", "seo-prop-firm-alternative", "seo-professional-clients", "seo-alternative-investment-platform", "seo-methodology", "seo-trader-verification-guide", "seo-verified-traders"].includes(view);
  const copyGuide = view === "seo-copy-trading-platform";
  const eligibilityGuide = view === "seo-professional-clients";
  const alternativeGuide = view === "seo-alternative-investment-platform";
  const serviceGuide = copyGuide || eligibilityGuide || alternativeGuide || ["seo-methodology", "seo-trader-verification-guide", "seo-verified-traders"].includes(view);
  const investorFirst = alternativeGuide || eligibilityGuide;
  const traderHref = "/traders";
  const investorHref = "/professional-investors";
  const primaryHref = commercial ? (investorFirst ? investorHref : traderHref) : "/turtle-analytics";
  const secondaryHref = commercial ? (investorFirst ? traderHref : investorHref) : "/university-competition";
  const followLocalLink = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/") && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      onNavigate(getViewFromPath(href));
    }
  };
  const defaultRelatedPages: Array<[string, ViewType]> = [
    ["Turtle Analytics", "turtle-analytics"],
    ["Trading Journal", "seo-trading-journal"],
    ["Trading Education", "seo-trading-education"],
    ["Methodology", "seo-methodology"],
  ];
  const relatedPagesByView: Partial<Record<ViewType, Array<[string, ViewType]>>> = {
    "seo-trading-analytics": [
      ["Turtle Analytics", "turtle-analytics"],
      ["Trading Journal", "seo-trading-journal"],
      ["Trading Expectancy", "seo-trading-expectancy"],
      ["Trading Drawdown", "seo-trading-drawdown"],
      ["Profit Factor", "seo-profit-factor-trading"],
      ["Trading Risk Management", "seo-trading-risk-management"],
    ],
    "seo-trading-journal": [
      ["Turtle Analytics", "turtle-analytics"],
      ["MT4 and MT5 Trading Journal", "seo-mt4-mt5-trading-journal"],
      ["Trading Analytics", "seo-trading-analytics"],
      ["Trading Performance Tracker", "seo-trading-performance-tracker"],
      ["Trading Expectancy", "seo-trading-expectancy"],
      ["Trading Risk Management", "seo-trading-risk-management"],
    ],
    "seo-trading-expectancy": [
      ["Risk/Reward Ratio", "seo-risk-reward-ratio-trading"],
      ["Profit Factor", "seo-profit-factor-trading"],
      ["Trading Journal", "seo-trading-journal"],
      ["Turtle Analytics", "turtle-analytics"],
    ],
    "seo-trading-drawdown": [
      ["Trading Risk Management", "seo-trading-risk-management"],
      ["Risk/Reward Ratio", "seo-risk-reward-ratio-trading"],
      ["Trading Performance Tracker", "seo-trading-performance-tracker"],
      ["Turtle Analytics", "turtle-analytics"],
    ],
    "seo-profit-factor-trading": [
      ["Trading Expectancy", "seo-trading-expectancy"],
      ["Risk/Reward Ratio", "seo-risk-reward-ratio-trading"],
      ["Trading Analytics", "seo-trading-analytics"],
      ["Turtle Analytics", "turtle-analytics"],
    ],
    "seo-risk-reward-ratio-trading": [
      ["Trading Expectancy", "seo-trading-expectancy"],
      ["Profit Factor", "seo-profit-factor-trading"],
      ["Trading Risk Management", "seo-trading-risk-management"],
      ["Turtle Analytics", "turtle-analytics"],
    ],
    "seo-verified-traders": [
      ["Trader Verification Guide", "seo-trader-verification-guide"],
      ["Methodology", "seo-methodology"],
      ["Trading Performance Tracker", "seo-trading-performance-tracker"],
      ["University Competition", "turtle-traders"],
    ],
    "seo-trader-verification-guide": [
      ["Verified Traders", "seo-verified-traders"],
      ["Methodology", "seo-methodology"],
      ["Trading Analytics", "seo-trading-analytics"],
      ["Trading Risk Management", "seo-trading-risk-management"],
    ],
    "seo-methodology": [
      ["Trader Verification Guide", "seo-trader-verification-guide"],
      ["Verified Traders", "seo-verified-traders"],
      ["Trading Analytics", "seo-trading-analytics"],
      ["University Competition", "turtle-traders"],
    ],
    "seo-mt4-mt5-trading-journal": [
      ["Trading Journal", "seo-trading-journal"],
      ["Turtle Analytics", "turtle-analytics"],
      ["Trading Performance Tracker", "seo-trading-performance-tracker"],
      ["Trader Verification Guide", "seo-trader-verification-guide"],
    ],
  };
  const relatedPages = relatedPagesByView[view] || defaultRelatedPages;

  const relatedLinks: Array<[string, string]> = (commercial
    ? [["For Professional Investors", investorHref], ["For Traders", traderHref], ["Alternative Investment Platform", "/alternative-investment-platform"], ["Copy Trading Platform", "/copy-trading-platform"], ["Trader Verification Guide", "/trader-verification-guide"], ["Methodology", "/methodology"], ["Professional Client Eligibility", "/professional-clients"]] as Array<[string, string]>
    : relatedPages.map(([label, target]) => [label, getPathForView(target)] as [string, string]))
    .filter(([, href]) => href !== getPathForView(view));

  const featureIcons = [ShieldCheck, BarChart3, LineChart, CheckCircle2];

  return (
    <div className={`seo-content-page${serviceGuide ? " seo-copy-guide" : ""} min-h-screen bg-white pt-20 text-slate-950`}>
      <section className="seo-article-header">
        <div className="seo-article-header-inner">
          <div>
          {serviceGuide && <NavigationLink view="landing" onClick={() => onNavigate("landing")} className="seo-guide-back">Green Turtle Trades <span aria-hidden="true">/</span> {eligibilityGuide ? "Professional clients" : alternativeGuide ? "Alternative investments" : "How it works"}</NavigationLink>}
          <div className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
            {page.eyebrow}
          </div>
          <h1 className="max-w-4xl text-4xl leading-tight tracking-tight text-slate-950 sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-800">
            {page.intro}
          </p>
          {serviceGuide && <p className="seo-guide-status"><span className="seo-guide-status-dot" aria-hidden="true" /><span>{seo.companyProfile.status}</span></p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={primaryHref}
              onClick={event => followLocalLink(event, primaryHref)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              {commercial ? (investorFirst ? "For Professional Investors" : "For Traders") : "Open Analytics"}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={secondaryHref}
              onClick={event => followLocalLink(event, secondaryHref)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:border-teal-500 hover:text-teal-700"
            >
              {commercial ? (investorFirst ? "For Traders" : "For Professional Investors") : "View Leaderboard"}
            </a>
          </div>
          </div>

        </div>
      </section>

      <div className="seo-reading-layout">
        <aside>
          <nav className="seo-section-index" aria-label="On this page">
            <p>On this page</p>
            {page.sections.map((section, index) => (
              <a key={section.title} href={`#article-section-${index + 1}`}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {section.title}
              </a>
            ))}
            <a href="#article-questions">Common questions</a>
            <a href="#article-related">Related topics</a>
          </nav>
        </aside>
        <div className="seo-reading-sections">
          {page.sections.map((section, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
            <section key={section.title} id={`article-section-${index + 1}`} className="seo-reading-section">
              <div className="seo-section-heading">
                <span className="seo-section-icon"><Icon size={22} aria-hidden="true" /></span>
                <h2>{section.title}</h2>
              </div>
              <p>{section.body}</p>
              {section.flow && <ol className="seo-guide-flow" aria-label="Proposed trade copying process">
                {section.flow.map((step, stepIndex) => <li key={step.title}>
                  <span className="seo-guide-step-number" aria-hidden="true">{stepIndex + 1}</span>
                  <h3>{step.title}</h3><p>{step.body}</p>
                  {stepIndex < section.flow!.length - 1 && <ArrowRight className="seo-guide-flow-arrow" size={20} aria-hidden="true" />}
                </li>)}
              </ol>}
              {section.responsibilities && <div className="seo-guide-roles">
                {section.responsibilities.map(role => <article key={role.title}><h3>{role.title}</h3><p>{role.body}</p></article>)}
              </div>}
              {section.comparison && <div className="seo-guide-comparison" role="region" aria-label="Retail copy trading and the proposed GTT model" tabIndex={0}>
                <table>
                  <caption>How the proposed GTT model compares</caption>
                  <thead><tr><th scope="col">Feature</th><th scope="col">Retail copy trading*</th><th scope="col">Proposed GTT model</th></tr></thead>
                  <tbody>{section.comparison.map(row => <tr key={row.topic}><th scope="row">{row.topic}</th><td>{row.retail}</td><td>{row.gtt}</td></tr>)}</tbody>
                </table>
                <p className="seo-guide-table-note">*An illustrative comparison. Retail platforms vary in eligibility, discretion, account structure and risk controls; check each provider’s actual terms.</p>
              </div>}
              {section.links && <div className="seo-guide-links">{section.links.map(link => <a key={link.href} href={link.href} onClick={event => followLocalLink(event, link.href)}>{link.label}<ArrowRight size={16} aria-hidden="true" /></a>)}</div>}
            </section>
            );
          })}
        </div>
      </div>

      {view === "seo-trading-expectancy" ? (
        <section className="bg-slate-950 px-4 py-14 text-white sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-3xl">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-teal-300">
                Calculator example
              </div>
              <h2 className="mt-2 text-3xl">Trading expectancy calculation</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Expectancy combines win rate with average win and average loss. This example uses fixed values so the formula is crawlable and easy to check.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Win rate", "50%"],
                ["Average win", "£120"],
                ["Average loss", "£70"],
                ["Expectancy", "£25 / trade"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-teal-400/30 bg-teal-400/10 p-5 text-sm text-teal-50">
              Formula: (0.50 x £120) - (0.50 x £70) = £25 expected average outcome per trade before costs and market changes.
            </div>
          </div>
        </section>
      ) : null}

      {view === "seo-trading-drawdown" ? (
        <section className="bg-slate-950 px-4 py-14 text-white sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-3xl">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-teal-300">
                Recovery math
              </div>
              <h2 className="mt-2 text-3xl">Drawdown recovery table</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                The deeper the drawdown, the larger the return needed to recover back to the previous equity high.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["5%", "5.3%"],
                ["10%", "11.1%"],
                ["20%", "25.0%"],
                ["30%", "42.9%"],
                ["40%", "66.7%"],
                ["50%", "100.0%"],
              ].map(([drawdown, recovery]) => (
                <div key={drawdown} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                  <span className="text-sm text-slate-300">{drawdown} drawdown</span>
                  <span className="text-lg text-white">{recovery} recovery</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {view === "seo-methodology" ? (
        <section className="bg-slate-950 px-4 py-14 text-white sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-3xl">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-teal-300">
                Calculation reference
              </div>
              <h2 className="mt-2 text-3xl">Core metric formulas</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Realised P/L", "Sum of closed-trade P/L after deduplication."],
                ["Unrealised P/L", "Sum of open-position P/L using the latest available market mark."],
                ["Total P/L", "Realised P/L plus unrealised P/L."],
                ["Return %", "Total P/L divided by starting balance, multiplied by 100."],
                ["Win rate", "Winning non-zero closed trades divided by all non-zero closed trades."],
                ["Profit factor", "Gross profit divided by absolute gross loss."],
                ["Max drawdown", "Largest peak-to-trough equity fall in the measured period."],
                ["Risk score", "Blend of risk per trade, stop coverage, leverage, largest loss, and open exposure."],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="article-questions" className="seo-questions bg-slate-50 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
              FAQ
            </div>
            <h2 className="mt-2 text-3xl text-slate-950">Common questions</h2>
          </div>
          <div className="grid gap-4">
            {page.faqs.map((faq) => (
              <article key={faq.question} className="seo-question">
                <h3 className="text-lg text-slate-950">{faq.question}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-700">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="article-related" className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
              Related topics
            </div>
            <h2 className="mt-2 text-3xl text-slate-950">Keep exploring</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedLinks.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={event => followLocalLink(event, href)}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-medium text-slate-800 transition-colors hover:border-teal-500 hover:text-teal-700"
              >
                <span>{label}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl text-slate-950">Explore Green Turtle Trades</h2>
            <p className="mt-2 text-sm text-slate-700">
              {commercial ? "Read about trader applications and the proposed service for professional clients. The investment service is in development." : "Explore supporting analytics or the virtual university competition. These are separate from the proposed professional client service."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={commercial ? investorHref : "/university-competition"}
              onClick={event => followLocalLink(event, commercial ? investorHref : "/university-competition")}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white transition-colors hover:bg-teal-700"
            >
              {commercial ? "For Professional Investors" : "University Competition"}
            </a>
            <a
              href={commercial ? traderHref : "/turtle-analytics"}
              onClick={event => followLocalLink(event, commercial ? traderHref : "/turtle-analytics")}
              className="rounded-lg border border-teal-300 bg-white px-4 py-2 text-sm text-teal-700 transition-colors hover:bg-teal-50"
            >
              {commercial ? "For Traders" : "Trading Analytics"}
            </a>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
