import { motion, useInView } from "motion/react";
import { useRef } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Eye,
  FileText,
  Lock,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Footer } from "./Footer";
import { ScrollProgress } from "./ScrollProgress";
import type { ViewType } from "../../seo/routes";

interface AboutPageProps {
  onNavigate: (view: ViewType) => void;
}

const solutionPoints = [
  {
    title: "Claims need context",
    body:
      "A result means more when people can see the risk taken, the sample size behind it, and whether it was repeated over time.",
    icon: Eye,
  },
  {
    title: "Records need structure",
    body:
      "Trade history, journal notes, drawdown, expectancy, and consistency should live in one place rather than across screenshots and spreadsheets.",
    icon: BarChart3,
  },
  {
    title: "Decisions need evidence",
    body:
      "Public summaries and analytics help people compare traders with clearer information while keeping sensitive raw trade data private.",
    icon: Lock,
  },
];

const trustStats = [
  {
    value: "4",
    label: "student founders",
    detail: "Building from Edinburgh with a focus on trading transparency.",
  },
  {
    value: "SC878660",
    label: "registered company",
    detail: "Green Turtle Trades Limited is registered in Scotland.",
  },
  {
    value: "Public",
    label: "performance summaries",
    detail: "Trader records can be reviewed through clearer analytics and leaderboard data.",
  },
];

const modelPoints = [
  {
    title: "Traders build evidence",
    body:
      "Serious traders can analyse performance, keep better records, and build a track record that stands up to scrutiny.",
    icon: Users,
  },
  {
    title: "Investors regain control",
    body:
      "People should have more visibility over where their capital goes and who is managing risk on their behalf.",
    icon: ShieldCheck,
  },
  {
    title: "Capital follows proof",
    body:
      "Our long-term aim is a clearer bridge between trading skill and investor capital, built around transparent performance data.",
    icon: Building2,
  },
];

export function AboutPage({ onNavigate }: AboutPageProps) {
  const storyRef = useRef(null);
  const storyInView = useInView(storyRef, { once: true, margin: "-100px" });
  const problemRef = useRef(null);
  const problemInView = useInView(problemRef, { once: true, margin: "-100px" });
  const modelRef = useRef(null);
  const modelInView = useInView(modelRef, { once: true, margin: "-100px" });

  return (
    <>
      <ScrollProgress />
      <div className="min-h-screen bg-white text-slate-950">
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 pb-14 pt-32 sm:px-6 sm:pb-16 sm:pt-36">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d94880a_1px,transparent_1px),linear-gradient(to_bottom,#0d94880a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-5xl text-center"
            >
              <h1 className="text-4xl leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                We started Green Turtle Trades to make trading, trust, and investing safer and easier.
              </h1>
              <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-slate-700 sm:text-xl lg:mt-10">
                We are four university students based in Edinburgh. We saw more people being pulled
                into trading propaganda, signal groups, and performance claims that were difficult
                to check. Green Turtle Trades is our answer: a secure platform where trader
                performance can be measured, compared, and understood.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-12 grid overflow-hidden rounded-3xl border border-teal-200 bg-white/80 shadow-2xl shadow-teal-900/10 backdrop-blur md:grid-cols-3"
            >
              {trustStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`p-6 sm:p-8 ${index > 0 ? "border-t border-slate-200 md:border-l md:border-t-0" : ""}`}
                >
                  <div className="text-3xl tracking-tight text-slate-950 sm:text-4xl">{stat.value}</div>
                  <div className="mt-2 text-sm uppercase tracking-widest text-teal-700">{stat.label}</div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{stat.detail}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="w-full bg-white px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="px-1 sm:px-3 lg:px-0"
            >
              <div className="mb-5 flex items-center gap-3 text-teal-700">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm uppercase tracking-widest">What guides us</span>
              </div>
              <blockquote className="text-2xl leading-snug tracking-tight text-slate-950 sm:text-3xl">
                Trust should come from a record, not from a promise.
              </blockquote>
              <p className="mt-6 text-base leading-relaxed text-slate-700">
                Green Turtle Trades is being built to make trader claims easier to check. We want
                people to see the evidence behind performance before they are asked to believe it.
              </p>
              <p className="mt-5 text-base leading-relaxed text-slate-700">
                A trader's results should be easier to review than a screenshot or a message in a
                group chat. Our focus is on turning trade history, risk, consistency, and
                performance data into something people can assess with more confidence.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-xl shadow-slate-900/5 sm:p-8"
              aria-label="From trading claims to verified evidence"
            >
              <div className="absolute left-11 top-12 hidden h-[calc(100%-6rem)] w-px bg-gradient-to-b from-slate-200 via-teal-300 to-cyan-300 sm:block" />
              <div className="space-y-4">
                {[
                  {
                    label: "The claim",
                    title: "Screenshots, signals, and bold promises",
                    body:
                      "Most people first see the marketing: a win screenshot, a private group, or a confident claim with very little context.",
                    icon: MessageSquare,
                    tone: "slate",
                  },
                  {
                    label: "The record",
                    title: "Trade history, risk, and consistency",
                    body:
                      "A stronger platform should show the parts that are harder to fake: sample size, drawdown, expectancy, and how risk is managed.",
                    icon: FileText,
                    tone: "teal",
                  },
                  {
                    label: "The decision",
                    title: "Evidence before belief",
                    body:
                      "When performance is easier to check, people can compare traders with clearer information instead of relying on persuasion alone.",
                    icon: BarChart3,
                    tone: "cyan",
                  },
                ].map((step, index) => {
                  const Icon = step.icon;
                  const accent =
                    step.tone === "slate"
                      ? "bg-slate-100 text-slate-700 border-slate-200"
                      : step.tone === "teal"
                        ? "bg-teal-100 text-teal-700 border-teal-200"
                        : "bg-cyan-100 text-cyan-700 border-cyan-200";

                  return (
                    <motion.article
                      key={step.label}
                      initial={{ opacity: 0, x: 24 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                      className="relative rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-teal-300 hover:shadow-lg sm:ml-16 sm:p-6"
                    >
                      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${accent} sm:absolute sm:-left-[5.2rem] sm:top-5`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-xs uppercase tracking-widest text-slate-400">{step.label}</div>
                      <h3 className="mt-2 text-xl text-slate-950">{step.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{step.body}</p>
                    </motion.article>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        <section ref={storyRef} className="w-full bg-white px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={storyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-sm uppercase tracking-widest text-teal-700">The reason</div>
              <h2 className="mt-3 text-3xl tracking-tight text-slate-950 sm:text-4xl">
                We wanted a better answer than screenshots and promises.
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={storyInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="space-y-5 text-lg leading-relaxed text-slate-700"
            >
              <p>
                Trading content has become more visible, but not always more honest. Many people
                see confident claims, lifestyle marketing, private communities, and performance
                screenshots without enough context to judge whether the trader is genuinely skilled.
              </p>
              <p>
                Our idea was simple: centralise the model in a platform where performance can be
                tracked properly. Instead of asking people to trust noise, give them tools to review
                risk, consistency, trade history, expectancy, and public summary performance.
              </p>
              <p>
                We are not trying to remove risk from trading. Trading will always involve risk. We
                are trying to make the information around trading more transparent, so people can
                make decisions with better evidence.
              </p>
            </motion.div>
          </div>
        </section>

        <section ref={problemRef} className="relative w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-4 py-12 sm:px-6 sm:py-16">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d948808_1px,transparent_1px),linear-gradient(to_bottom,#0d948808_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-40" />
          <div className="relative z-10 mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={problemInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.6 }}
              className="lg:sticky lg:top-32"
            >
              <div className="text-sm uppercase tracking-widest text-teal-700">What we are solving</div>
              <h2 className="mt-3 text-2xl tracking-tight text-slate-950 sm:text-3xl">
                A secure place for trader performance to be seen clearly.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                The problem is not that people are interested in trading. The problem is that too
                many decisions are made from claims that are hard to verify.
              </p>
            </motion.div>

            <div className="space-y-3">
              {solutionPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <motion.article
                    key={point.title}
                    initial={{ opacity: 0, y: 28 }}
                    animate={problemInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-teal-300 hover:shadow-lg sm:grid-cols-[auto_1fr] sm:p-5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-400">
                        0{index + 1}
                      </div>
                      <h3 className="mt-1 text-lg text-slate-950">{point.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{point.body}</p>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section ref={modelRef} className="w-full bg-white px-4 py-12 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={modelInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.6 }}
              className="mx-auto mb-8 max-w-3xl text-left sm:mb-12 sm:text-center"
            >
              <div className="text-xs uppercase tracking-widest text-teal-700 sm:text-sm">The bigger ambition</div>
              <h2 className="mt-3 text-2xl leading-tight tracking-tight text-slate-950 sm:text-4xl">
                Building the UK's most transparent platform for trader-backed investing.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                We believe people should have more control over their investments and more clarity
                over who is managing risk on their behalf.
              </p>
            </motion.div>

            <div className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm sm:rounded-3xl sm:bg-gradient-to-br sm:from-teal-50 sm:to-white sm:shadow-xl sm:shadow-teal-900/5">
              <div className="grid lg:grid-cols-3">
              {modelPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <motion.article
                    key={point.title}
                    initial={{ opacity: 0, y: 28 }}
                    animate={modelInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`group grid grid-cols-[auto_1fr] gap-4 p-4 transition-all hover:bg-white/70 sm:block sm:p-8 ${
                      index > 0 ? "border-t border-teal-200 lg:border-l lg:border-t-0" : ""
                    }`}
                  >
                    <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700 sm:mb-6 sm:h-12 sm:w-12 sm:rounded-xl sm:bg-gradient-to-br sm:from-teal-600 sm:to-cyan-600 sm:text-white sm:shadow-lg sm:transition-transform sm:group-hover:scale-105">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <div className="mb-1 text-[11px] uppercase tracking-widest text-teal-700 sm:mb-3 sm:text-xs">
                        {index === 0 ? "Trader side" : index === 1 ? "Investor side" : "Market side"}
                      </div>
                      <h3 className="text-lg leading-snug text-slate-950 sm:text-2xl">{point.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:mt-3 sm:text-base">{point.body}</p>
                    </div>
                  </motion.article>
                );
              })}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-white px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-slate-200 pt-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-3xl">
              <div className="text-sm uppercase tracking-widest text-teal-700">See the platform</div>
              <h2 className="mt-2 text-2xl tracking-tight text-slate-950 sm:text-3xl">
                Built to make trader claims accountable.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                Explore the analytics product or view the public leaderboard to see how Green
                Turtle Trades turns performance into clearer evidence.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-shrink-0">
              <button
                type="button"
                onClick={() => onNavigate("turtle-analytics")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm text-white transition-all hover:from-teal-700 hover:to-cyan-700"
              >
                <BarChart3 className="h-4 w-4" />
                Trading Analytics
              </button>
              <button
                type="button"
                onClick={() => onNavigate("turtle-traders")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm text-slate-900 transition-all hover:border-teal-300 hover:text-teal-700"
              >
                <Users className="h-4 w-4" />
                Traders Leaderboard
              </button>
            </div>
          </div>
        </section>

        <Footer onNavigate={onNavigate} />
      </div>
    </>
  );
}
