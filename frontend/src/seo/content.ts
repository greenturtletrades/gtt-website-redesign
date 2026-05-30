import type { ViewType } from "./routes";

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

export const seoContentPages: SeoContentPage[] = [
  {
    view: "seo-trading-analytics",
    title: "Trading Analytics",
    eyebrow: "Trading Analytics",
    description:
      "Trading analytics helps traders review performance, risk control, expectancy, trade timing, and historical trade behaviour with clear data.",
    keywords:
      "trading analytics, trading performance analytics, trading analytics platform, trade analytics, trading performance analysis",
    intro:
      "Green Turtle Trades gives traders a clearer way to understand performance. Turtle Analytics turns trade history into structured insight across expectancy, risk, win rate, drawdown, holding time, and strategy behaviour.",
    sections: [
      {
        title: "Performance data built around real trading history",
        body:
          "Good trading analytics should explain what is happening across actual trades, not rely on screenshots or headline returns. Turtle Analytics reviews recorded trade history so traders can understand where performance is strong, where risk is too high, and which behaviours need attention.",
      },
      {
        title: "Risk, expectancy, and consistency in one place",
        body:
          "The platform focuses on practical trading metrics such as R-multiple, win rate, profit factor, average risk, trade duration, and market conditions. These metrics help traders judge whether results come from repeatable edge or from one-off outcomes.",
      },
      {
        title: "Private analytics, public proof when traders choose it",
        body:
          "Raw trade data remains private. Traders can choose to publish summary performance on the public traders leaderboard, while CSV-imported trades are excluded from public ranking calculations due to tampering risk.",
      },
    ],
    faqs: [
      {
        question: "What is trading analytics?",
        answer:
          "Trading analytics is the process of reviewing trade history, risk, expectancy, win rate, drawdown, and behaviour patterns to understand trading performance.",
      },
      {
        question: "Does Turtle Analytics predict market prices?",
        answer:
          "No. Turtle Analytics focuses on historical trade behaviour and performance analysis. It does not make market predictions.",
      },
      {
        question: "Can CSV trades be used in private analytics?",
        answer:
          "Yes. CSV trades can be used privately for analytics and journal work, but CSV-imported trades are excluded from public leaderboard calculations.",
      },
    ],
  },
  {
    view: "seo-trading-journal",
    title: "Trading Journal",
    eyebrow: "Trading Journal",
    description:
      "A trading journal for recording trades, reviewing performance, tracking lessons, and understanding risk across your trading history.",
    keywords:
      "trading journal, trade journal, forex trading journal, trading journal app, trading performance journal",
    intro:
      "A trading journal is where traders turn trade history into feedback. Green Turtle Trades helps traders keep a structured record of trades, notes, lessons, performance, and risk.",
    sections: [
      {
        title: "Track trades and behaviour together",
        body:
          "A useful trading journal should hold more than entry and exit prices. Traders need notes, emotions, lessons learned, trade timing, risk, and performance context so they can review both decisions and outcomes.",
      },
      {
        title: "Connect journal data to analytics",
        body:
          "Green Turtle Trades connects journal records with Turtle Analytics so traders can move from simple record keeping to deeper performance analysis across expectancy, drawdown, holding time, and market regime behaviour.",
      },
      {
        title: "Private records, optional public summary",
        body:
          "Journal data stays private by default. Traders can opt in to publish summary performance on the public leaderboard, but raw trades are not made public.",
      },
    ],
    faqs: [
      {
        question: "What should a trading journal include?",
        answer:
          "A trading journal should include entry and exit data, risk, position direction, notes, trade lessons, emotions, and performance metrics.",
      },
      {
        question: "Is a trading journal useful for beginners?",
        answer:
          "Yes. A journal helps new traders build discipline, review mistakes, and understand whether progress is based on repeatable behaviour.",
      },
      {
        question: "Are my journal trades public?",
        answer:
          "No. Raw journal trades stay private. Only optional summary stats can appear publicly if a trader enables leaderboard publishing.",
      },
    ],
  },
  {
    view: "seo-verified-traders",
    title: "Verified Traders",
    eyebrow: "Verified Traders",
    description:
      "Green Turtle Trades focuses on verified traders, transparent performance data, risk control, and investor trust.",
    keywords:
      "verified traders, verified trading performance, transparent traders, trader verification, professional traders",
    intro:
      "Verified trader data matters because trust cannot be built from screenshots alone. Green Turtle Trades is designed around transparent performance records, risk controls, and trader accountability.",
    sections: [
      {
        title: "Why verification matters",
        body:
          "Investors and platforms need to understand whether a trader's results come from real performance, responsible risk, and a meaningful trade history. Verified data helps separate repeatable skill from isolated outcomes.",
      },
      {
        title: "Performance without exposing raw trades",
        body:
          "The public traders leaderboard shows summary performance while keeping raw trades private. This gives visitors a clearer view of trader quality without exposing sensitive trading records.",
      },
      {
        title: "Built for serious trader evaluation",
        body:
          "Green Turtle Trades combines trading analytics, journal data, risk metrics, and transparent ranking logic to support more responsible trader evaluation.",
      },
    ],
    faqs: [
      {
        question: "What is a verified trader?",
        answer:
          "A verified trader is a trader whose performance can be reviewed through account-connected or platform-recorded trade data rather than unsupported claims.",
      },
      {
        question: "Do verified traders publish every trade?",
        answer:
          "No. Raw trades stay private. Public pages show summary statistics such as win rate, expectancy, risk, and total verified trades.",
      },
      {
        question: "Why are CSV trades excluded from public ranking?",
        answer:
          "CSV files can be edited outside the platform, so they are not trusted for public leaderboard ranking calculations.",
      },
    ],
  },
  {
    view: "seo-investor-capital",
    title: "Investor Capital for Traders",
    eyebrow: "Investor Capital",
    description:
      "Green Turtle Trades helps connect skilled verified traders with investor capital through transparent performance data.",
    keywords:
      "investor capital for traders, trader funding, trading capital, verified traders investor capital, capital for traders",
    intro:
      "Many skilled traders need reliable capital, while investors need clearer ways to evaluate trader performance. Green Turtle Trades is building a transparent bridge between trader skill and investor capital.",
    sections: [
      {
        title: "A more transparent route to trading capital",
        body:
          "Traditional funding routes often rely on challenges, marketing claims, or limited performance context. Green Turtle Trades is designed around real performance records, risk metrics, and transparent trader evaluation.",
      },
      {
        title: "Analytics before allocation",
        body:
          "Trading analytics and journal data help show whether a trader is consistent, risk-aware, and capable of managing capital responsibly.",
      },
      {
        title: "Aligned incentives",
        body:
          "The platform is built around the idea that traders and investors should benefit together through transparent performance and responsible risk management.",
      },
    ],
    faqs: [
      {
        question: "How can traders access investor capital?",
        answer:
          "Traders can apply to Green Turtle Trades and build a performance record through verified data, analytics, and transparent summary metrics.",
      },
      {
        question: "What do investors need to evaluate traders?",
        answer:
          "Investors need transparent performance metrics, risk controls, trade sample size, win rate, expectancy, and evidence of consistency.",
      },
      {
        question: "Is Green Turtle Trades a prop firm?",
        answer:
          "Green Turtle Trades is building a transparent platform connecting trader skill and investor capital, with a focus on verified performance and aligned incentives.",
      },
    ],
  },
  {
    view: "seo-trader-marketplace",
    title: "Trader Marketplace",
    eyebrow: "Trader Marketplace",
    description:
      "A trader marketplace concept built around verified performance, transparent metrics, trading analytics, and investor decision-making.",
    keywords:
      "trader marketplace, trading marketplace, copy trading platform, verified trader marketplace, trader performance marketplace",
    intro:
      "A trader marketplace should help investors compare traders with clear, verified performance data instead of relying on claims or screenshots.",
    sections: [
      {
        title: "Compare traders with meaningful metrics",
        body:
          "Useful trader comparison needs more than headline gain. Win rate, expectancy, risk per trade, sample size, profit factor, and consistency all matter when judging trading performance.",
      },
      {
        title: "Public leaderboard as a trust layer",
        body:
          "The public traders leaderboard gives visitors a transparent summary of opted-in trader performance while keeping raw trades private.",
      },
      {
        title: "Trading analytics behind the marketplace",
        body:
          "Turtle Analytics and journal data help traders understand their own performance before that performance becomes part of a broader marketplace or investor evaluation workflow.",
      },
    ],
    faqs: [
      {
        question: "What is a trader marketplace?",
        answer:
          "A trader marketplace is a platform where investors can discover, compare, and evaluate traders using performance data and risk metrics.",
      },
      {
        question: "How should traders be ranked?",
        answer:
          "Traders should be ranked with balanced metrics such as win rate, expectancy, risk control, sample size, and consistency rather than headline returns alone.",
      },
      {
        question: "Does Green Turtle Trades publish raw trades?",
        answer:
          "No. Raw trades stay private. Public pages show optional summary performance only.",
      },
    ],
  },
];

export function getSeoContentPage(view: ViewType) {
  return seoContentPages.find((page) => page.view === view) || null;
}
