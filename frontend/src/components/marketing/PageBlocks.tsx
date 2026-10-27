import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Info } from "lucide-react";
import "../../styles/home-brand.css";
import "../../styles/gtt-pages.css";

export type Tone = "trader" | "investor";

export function PageShell({ tone, children }: { tone?: Tone; children: ReactNode }) {
  return <div className={`home-experience gtt-page${tone ? ` gtt-tone-${tone}` : ""}`}>{children}</div>;
}

export function NoticeBanner({ children }: { children: ReactNode }) {
  return <div className="gtt-notice" role="note"><Info size={18} aria-hidden="true" /><div>{children}</div></div>;
}

export function ProposedBadge({ children = "Proposed, subject to host" }: { children?: ReactNode }) {
  return <span className="gtt-badge">{children}</span>;
}

export function SectionHeading({ kicker, title, intro, align = "centre", id }: { kicker?: string; title: ReactNode; intro?: ReactNode; align?: "centre" | "left"; id?: string }) {
  return <header className={`home-section-heading${align === "left" ? " gtt-heading-left" : ""}`}>
    {kicker && <span className="home-kicker">{kicker}</span>}
    <h2 id={id}>{title}</h2>
    {intro && <p>{intro}</p>}
  </header>;
}

export interface Step {
  title: string;
  description: ReactNode;
}

export function StepTimeline({ steps, layout = "horizontal" }: { steps: Step[]; layout?: "horizontal" | "vertical" }) {
  return <ol className={`gtt-steps gtt-steps-${layout}`} style={{ ["--gtt-step-count" as string]: steps.length }}>
    {steps.map((step, index) => <li className="gtt-step" key={step.title}>
      <span className="gtt-step-number" aria-hidden="true">{index + 1}</span>
      <div><h3><span className="sr-only">Step {index + 1}: </span>{step.title}</h3><p>{step.description}</p></div>
    </li>)}
  </ol>;
}

export function CheckList({ items }: { items: ReactNode[] }) {
  return <ul className="gtt-check-list">
    {items.map((item, index) => <li key={index}><CheckCircle2 size={18} aria-hidden="true" /><span>{item}</span></li>)}
  </ul>;
}

export function RouteCard({ tone, label, title, description, bullets, action, onAction }: { tone: Tone; label: string; title: string; description: string; bullets: string[]; action: string; onAction: () => void }) {
  return <article className={`gtt-route-card gtt-tone-${tone}`}>
    <span className="gtt-route-label">{label}</span>
    <h3>{title}</h3>
    <p>{description}</p>
    <CheckList items={bullets} />
    <button type="button" className={`home-brand-button gtt-button-${tone}`} onClick={onAction}>{action}<ArrowRight size={18} aria-hidden="true" /></button>
  </article>;
}

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return <div className="gtt-faq">
    {items.map((item) => <details key={item.question}>
      <summary>{item.question}<ChevronDown size={20} aria-hidden="true" /></summary>
      <div>{typeof item.answer === "string" ? <p>{item.answer}</p> : item.answer}</div>
    </details>)}
  </div>;
}

export function CtaBand({ title, text, children, small }: { title: string; text?: ReactNode; children: ReactNode; small?: ReactNode }) {
  return <section className="gtt-cta">
    <div className="home-section-inner">
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      <div className="gtt-hero-actions">{children}</div>
      {small && <p className="gtt-hero-small">{small}</p>}
    </div>
  </section>;
}
