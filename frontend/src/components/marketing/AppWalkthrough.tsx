import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, BatteryFull, ShieldCheck, Signal, Trophy, Users, Wifi } from "lucide-react";
import marketplace from "../../assets/app-preview/marketplace.png";
import profile from "../../assets/app-preview/profile.png";
import portfolio from "../../assets/app-preview/portfolio.png";
import competition from "../../assets/app-preview/competition.png";
import type { ViewType } from "../../seo/routes";
import "../../styles/app-walkthrough.css";

const chapters = [
  {
    label: "Discover", icon: Users, title: "Trading talent.\nBacked by evidence.",
    description: "Bring trading talent and informed investors closer together, with performance and risk in plain view.",
    investor: "Compare trading styles, returns, and risk before choosing who to follow.",
    trader: "Give your track record a home where people can discover your approach.", image: marketplace,
    alt: "Turtle Trades marketplace with fictional trader profiles and their performance metrics",
  },
  {
    label: "Understand", icon: ShieldCheck, title: "Beyond the returns.\nBehind the decisions.",
    description: "A single winning trade only tells part of the story. See the decisions and discipline behind the results.",
    investor: "Review drawdown and trading history to understand how returns were achieved.",
    trader: "Show your consistency over time and use your trading record to spot areas to improve.", image: profile,
    alt: "Turtle Trades demo trader profile showing a performance chart and trading statistics",
  },
  {
    label: "Follow", icon: BarChart3, title: "Every allocation.\nOne clear view.",
    description: "A preview of the portfolio experience we are building, ahead of future real-capital access and shared profits.",
    investor: "See how planned allocation tools could help you track each trader's contribution.",
    trader: "Build a visible performance record in preparation for future investor-capital opportunities.", image: portfolio,
    alt: "Turtle Trades demo portfolio with fictional allocations and a portfolio value chart",
  },
  {
    label: "Compete", icon: Trophy, title: "New talent.\nA shared ambition.",
    description: "Separate from the app in development, our university competition runs on its own website with virtual capital and an official leaderboard.",
    investor: "Follow emerging talent and explore the competition, even if you aren't a student.",
    trader: "Eligible students can practise, represent their university, and learn without risking personal money.", image: competition,
    alt: "University competition board populated with illustrative university rankings",
  },
];

function PreviewHeading({ competition = false }: { competition?: boolean }) {
  return <div className="walkthrough-preview-heading"><p>{competition ? "University competition website" : "Turtle Trades app preview"}</p><span>{competition ? "Separate from the app. Available in your browser." : "In development. Not yet available to download."}</span></div>;
}

function PhoneChrome() {
  return <>
    <div className="walkthrough-status" aria-hidden="true"><span>9:41</span><i className="walkthrough-island" /><span><Signal /><Wifi /><BatteryFull /></span></div>
    <div className="walkthrough-home-indicator" aria-hidden="true" />
  </>;
}

function ChapterCopy({ index, onNavigate, interactive = true }: { index: number; onNavigate?: (view: ViewType) => void; interactive?: boolean }) {
  const chapter = chapters[index];
  const Icon = chapter.icon;
  return <>
    <div className="walkthrough-eyebrow"><Icon size={17} aria-hidden="true" /><span>{index === 3 ? "University competition / Separate website" : `0${index + 1} / ${chapter.label}`}</span></div>
    <h2>{chapter.title.split("\n").map((line, i) => <span key={line}>{i > 0 && <br />}{line}</span>)}</h2>
    <p className="walkthrough-description">{chapter.description}</p>
    <dl className="walkthrough-benefits">
      <div><dt>For investors</dt><dd>{chapter.investor}</dd></div>
      <div><dt>For traders</dt><dd>{chapter.trader}</dd></div>
    </dl>
    {index === 3 && <button className="walkthrough-link" tabIndex={interactive ? 0 : -1} onClick={() => onNavigate?.("turtle-traders")}>View the official competition <ArrowRight size={18} /></button>}
  </>;
}

export function AppWalkthrough({ onNavigate }: { onNavigate?: (view: ViewType) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const staticQuery = "(prefers-reduced-motion: reduce), (max-height: 760px), (max-width: 700px) and (max-height: 960px), (max-width: 359px)";
  const [staticLayout, setStaticLayout] = useState(() => window.matchMedia(staticQuery).matches);

  useEffect(() => {
    const media = window.matchMedia(staticQuery);
    const update = () => setStaticLayout(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (staticLayout) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const section = sectionRef.current;
        const stage = stageRef.current;
        if (!section || !stage) return;
        const top = parseFloat(getComputedStyle(stage).top) || 0;
        const distance = section.offsetHeight - stage.offsetHeight;
        const progress = Math.max(0, Math.min(1, (top - section.getBoundingClientRect().top) / Math.max(1, distance)));
        // Animate to complete chapters, never to a partially scrolled screen.
        const chapter = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
        setActive(chapter);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [staticLayout]);

  const goToChapter = (index: number) => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const inset = parseFloat(getComputedStyle(stage).top) || 0;
    const distance = section.offsetHeight - stage.offsetHeight;
    const target = window.scrollY + section.getBoundingClientRect().top - inset + distance * ((index + 0.5) / 4);
    window.scrollTo({ top: target, behavior: "smooth" });
  };
  if (staticLayout) return <section className="walkthrough-static" aria-label="Turtle Trades app preview">
    <div className="walkthrough-static-heading"><PreviewHeading /></div>
    {chapters.map((chapter, index) => <article className="walkthrough-static-chapter" key={chapter.label}>
      <div className="walkthrough-copy"><ChapterCopy index={index} onNavigate={onNavigate} /></div>
      <figure className="walkthrough-static-phone"><div className="walkthrough-device"><PhoneChrome /><div className="walkthrough-screen"><img src={chapter.image} alt={chapter.alt} width={780} height={1560} loading="lazy" /></div></div><figcaption>{index === 3 ? "Competition website preview. Illustrative data." : "App in development. Illustrative demo data."}</figcaption></figure>
    </article>)}
  </section>;

  return <section className="app-walkthrough" ref={sectionRef} aria-label="Turtle Trades app preview">
    <div className="walkthrough-stage" ref={stageRef} data-chapter={active}>
      <div className="walkthrough-topline">
        <PreviewHeading competition={active === 3} />
        <nav aria-label="App walkthrough chapters">
          {chapters.map((chapter, index) => <button key={chapter.label} onClick={() => goToChapter(index)} aria-current={active === index ? "step" : undefined}><span>0{index + 1}</span>{chapter.label}</button>)}
        </nav>
      </div>
      <div className="walkthrough-arena">
        <div className="walkthrough-copy-lane">
        {chapters.map((chapter, index) => {
          const distance = index - active;
          return <div className="walkthrough-copy-slot" key={chapter.label} aria-hidden={index !== active} style={{ transform: `translateY(${distance * 100}%)`, visibility: Math.abs(distance) < 1.1 ? "visible" : "hidden", pointerEvents: index === active ? "auto" : "none" }}>
            <div className="walkthrough-copy"><ChapterCopy index={index} onNavigate={onNavigate} interactive={index === active} /></div>
          </div>;
        })}
        </div>
        <figure className="walkthrough-phone">
          <div className="walkthrough-device">
            <PhoneChrome />
            <div className="walkthrough-screen">
            {chapters.map((chapter, index) => {
              const opacity = active === index ? 1 : 0;
              return <img key={chapter.label} src={chapter.image} style={{ opacity }} alt={active === index ? chapter.alt : ""} aria-hidden={active !== index} width={780} height={1560} decoding="async" />;
            })}
            </div>
          </div>
          <figcaption>{active === 3 ? "Competition website preview. Illustrative data." : "App in development. Illustrative demo data."}</figcaption>
        </figure>
      </div>
    </div>
  </section>;
}
