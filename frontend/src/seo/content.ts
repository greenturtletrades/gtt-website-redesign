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
  {
    view: "seo-copy-trading-platform",
    title: "Copy Trading Platform",
    eyebrow: "Copy Trading",
    description:
      "A copy trading platform concept focused on verified trader performance, transparent risk metrics, and investor decision-making.",
    keywords:
      "copy trading platform, copy trading, copy trader, verified copy trading, transparent copy trading platform",
    intro:
      "Copy trading should be built around trust, risk visibility, and real performance data. Green Turtle Trades is designed to help investors evaluate traders with transparent metrics before capital follows skill.",
    sections: [
      {
        title: "Verified performance before allocation",
        body:
          "A stronger copy trading workflow starts with verified trader performance, not screenshots or unsupported claims. Public summary metrics and private analytics help explain whether a trader has consistency, expectancy, and controlled risk.",
      },
      {
        title: "Risk matters as much as return",
        body:
          "The goal is not simply to find traders with the biggest headline gain. Risk per trade, drawdown behaviour, sample size, and win rate all help investors understand whether performance is sustainable.",
      },
      {
        title: "Transparency without exposing raw trades",
        body:
          "Green Turtle Trades can show public summary performance while keeping raw trade details private. CSV-imported trades are excluded from public leaderboard ranking because they are easier to edit outside the platform.",
      },
    ],
    faqs: [
      {
        question: "What is a copy trading platform?",
        answer:
          "A copy trading platform lets investors follow or allocate capital to traders, usually based on trader performance, risk metrics, and strategy behaviour.",
      },
      {
        question: "What makes copy trading safer to evaluate?",
        answer:
          "Investors should review verified trade history, risk control, sample size, expectancy, and consistency instead of relying only on headline returns.",
      },
      {
        question: "Does Green Turtle Trades show raw trades publicly?",
        answer:
          "No. Raw trades stay private. Public pages show optional summary performance and ranking metrics only.",
      },
    ],
  },
  {
    view: "seo-trader-funding",
    title: "Trader Funding",
    eyebrow: "Trader Funding",
    description:
      "Trader funding information for skilled traders looking to build transparent performance records and access investor capital.",
    keywords:
      "trader funding, funded trader, trading capital, funded trading account, capital for traders, trader funding platform",
    intro:
      "Trader funding should reward real skill, disciplined risk, and transparent performance. Green Turtle Trades helps traders build the kind of performance record investors can understand.",
    sections: [
      {
        title: "Capital should follow evidence",
        body:
          "Strong trader funding decisions need more than a short challenge result. Verified performance data, journal history, risk metrics, and repeatable behaviour create a clearer picture of trader quality.",
      },
      {
        title: "Build a record investors can review",
        body:
          "Trading analytics and journal tools help traders understand their own performance and present summary evidence without exposing raw trades publicly.",
      },
      {
        title: "Designed around alignment",
        body:
          "Green Turtle Trades is built around the idea that trader incentives and investor outcomes should be aligned through transparent performance and responsible risk management.",
      },
    ],
    faqs: [
      {
        question: "What is trader funding?",
        answer:
          "Trader funding is when a trader receives access to external capital or allocation opportunities based on skill, risk control, and performance evidence.",
      },
      {
        question: "How can traders improve funding eligibility?",
        answer:
          "Traders can improve by keeping a structured journal, reviewing analytics, managing risk, and building a transparent record of verified performance.",
      },
      {
        question: "Does Green Turtle Trades use trading challenges?",
        answer:
          "Green Turtle Trades is focused on transparent trader evaluation, verified performance, and investor-capital alignment rather than unrealistic challenge marketing.",
      },
    ],
  },
  {
    view: "seo-prop-firm-alternative",
    title: "Prop Firm Alternative",
    eyebrow: "Prop Firm Alternative",
    description:
      "A transparent alternative to prop firm challenges, focused on verified trader performance, trading analytics, and aligned investor capital.",
    keywords:
      "prop firm alternative, prop trading alternative, funded trader alternative, trader capital alternative, trading challenge alternative",
    intro:
      "Many traders want capital without unrealistic challenges or unclear incentives. Green Turtle Trades is building a more transparent alternative focused on verified data and responsible risk.",
    sections: [
      {
        title: "Beyond one-off trading challenges",
        body:
          "A short challenge can miss the deeper question: can a trader manage risk and perform consistently over time? Green Turtle Trades focuses on richer performance evidence.",
      },
      {
        title: "Transparent metrics for serious traders",
        body:
          "Trading analytics, journal records, win rate, expectancy, risk control, and verified trade sample size create a better foundation for evaluating traders.",
      },
      {
        title: "Investor capital with clearer alignment",
        body:
          "The platform is built around connecting capital and skill through transparency, not through opaque pass-fail rules that may not reflect long-term trading quality.",
      },
    ],
    faqs: [
      {
        question: "What is a prop firm alternative?",
        answer:
          "A prop firm alternative is another route for traders to access trading capital without relying only on traditional challenge-based funding models.",
      },
      {
        question: "Why look beyond prop firm challenges?",
        answer:
          "Some challenges can reward short-term behaviour. Verified performance records and risk analytics can provide a broader view of trader quality.",
      },
      {
        question: "Can new traders use Green Turtle Trades?",
        answer:
          "Yes. New traders can start with journal and analytics workflows, then build a performance record over time.",
      },
    ],
  },
  {
    view: "seo-trading-performance-tracker",
    title: "Trading Performance Tracker",
    eyebrow: "Performance Tracking",
    description:
      "Track trading performance with metrics such as win rate, expectancy, R-multiple, risk per trade, drawdown, and trade history.",
    keywords:
      "trading performance tracker, trading performance, trade tracker, trading metrics, track trading performance",
    intro:
      "A trading performance tracker helps traders understand whether their results are consistent, risk-aware, and repeatable. Green Turtle Trades combines performance tracking with journal and analytics workflows.",
    sections: [
      {
        title: "Track the metrics that explain performance",
        body:
          "Win rate, expectancy, R-multiple, profit factor, risk per trade, and sample size all help explain whether trading results come from a repeatable edge.",
      },
      {
        title: "Connect results to behaviour",
        body:
          "Performance tracking is most useful when it links results to trader behaviour, notes, timing, market conditions, and risk decisions.",
      },
      {
        title: "Turn tracking into improvement",
        body:
          "Turtle Analytics helps traders move from simple tracking to deeper analysis by showing patterns across trade history and risk behaviour.",
      },
    ],
    faqs: [
      {
        question: "What is a trading performance tracker?",
        answer:
          "A trading performance tracker records and summarizes trading results so traders can review metrics such as win rate, expectancy, risk, and trade history.",
      },
      {
        question: "Which trading metrics matter most?",
        answer:
          "Useful metrics include expectancy, win rate, R-multiple, profit factor, risk per trade, drawdown, sample size, and consistency.",
      },
      {
        question: "Can performance tracking help risk management?",
        answer:
          "Yes. Tracking risk per trade and drawdown behaviour helps traders identify when risk is too high or inconsistent.",
      },
    ],
  },
  {
    view: "seo-trading-risk-management",
    title: "Trading Risk Management",
    eyebrow: "Risk Management",
    description:
      "Trading risk management tools and analytics for reviewing risk per trade, drawdown, expectancy, and trader consistency.",
    keywords:
      "trading risk management, risk management trading, trading risk analytics, risk per trade, trading drawdown",
    intro:
      "Risk management is central to serious trading. Green Turtle Trades helps traders review risk per trade, drawdown behaviour, expectancy, and performance consistency.",
    sections: [
      {
        title: "Risk is part of every trade",
        body:
          "Every trade has risk. The question is whether that risk is measured, controlled, and consistent with the trader's edge and account objectives.",
      },
      {
        title: "Use analytics to spot weak risk habits",
        body:
          "Trading analytics can highlight oversized risk, weak setups, poor reward-to-risk behaviour, and conditions where a trader tends to underperform.",
      },
      {
        title: "Public rankings reward controlled risk",
        body:
          "The public traders leaderboard includes risk per trade as part of its ranking model because responsible risk control should support performance.",
      },
    ],
    faqs: [
      {
        question: "What is trading risk management?",
        answer:
          "Trading risk management is the process of controlling position risk, drawdown, loss exposure, and decision quality across trades.",
      },
      {
        question: "Why is risk per trade important?",
        answer:
          "Risk per trade shows how much a trader is exposing on each position. Consistent risk helps make performance easier to evaluate.",
      },
      {
        question: "Can analytics improve trading risk management?",
        answer:
          "Analytics can reveal patterns in losses, drawdowns, trade duration, stop placement, and conditions where risk tends to increase.",
      },
    ],
  },
  {
    view: "seo-mt4-mt5-trading-journal",
    title: "MT4 and MT5 Trading Journal",
    eyebrow: "MetaTrader Journal",
    description:
      "A trading journal and analytics workflow for MetaTrader 4 and MetaTrader 5 traders who want clearer performance records.",
    keywords:
      "MT4 trading journal, MT5 trading journal, MetaTrader trading journal, MetaTrader analytics, MT4 analytics, MT5 analytics",
    intro:
      "MetaTrader traders need a clear way to turn account history into performance feedback. Green Turtle Trades supports MetaTrader-connected workflows for journal records and analytics.",
    sections: [
      {
        title: "Bring MetaTrader history into a journal workflow",
        body:
          "A MetaTrader trading journal helps traders review entries, exits, risk, holding time, and notes in a more structured way than account history alone.",
      },
      {
        title: "Analyze MT4 and MT5 performance",
        body:
          "Turtle Analytics can use connected trade history to review performance metrics, risk behaviour, expectancy, and patterns across a trader's own historical trades.",
      },
      {
        title: "Keep raw trades private",
        body:
          "MetaTrader-connected data can support private analytics and optional public summary performance, while raw trade details remain private.",
      },
    ],
    faqs: [
      {
        question: "What is an MT4 trading journal?",
        answer:
          "An MT4 trading journal is a structured record of MetaTrader 4 trade history, notes, risk, and performance metrics.",
      },
      {
        question: "Can MT5 traders use a trading journal?",
        answer:
          "Yes. MT5 traders can use journal and analytics workflows to review performance, risk, expectancy, and trade history.",
      },
      {
        question: "Is MetaTrader data better than CSV for public ranking?",
        answer:
          "Connected account data is more trustworthy for public ranking than CSV files because CSV files can be edited outside the platform.",
      },
    ],
  },
];

export function getSeoContentPage(view: ViewType) {
  return seoContentPages.find((page) => page.view === view) || null;
}
