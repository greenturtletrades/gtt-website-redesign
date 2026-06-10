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
    view: "seo-green-turtle-trades",
    title: "Green Turtle Trades and Green Turtle Traders",
    eyebrow: "Company",
    description:
      "Green Turtle Trades, also searched as Green Turtle Traders, is a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited, company number SC878660.",
    keywords:
      "green turtle trades, green turtle traders, Green Turtle Trades Limited, Green Turtle Traders UK, green turtle trading platform, SC878660, UK trading analytics platform, verified trader platform, Turtle Analytics",
    intro:
      "Green Turtle Trades is a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited, company number SC878660. People may also search for Green Turtle Traders because the official website is greenturtletraders.co.uk. It helps traders review real trade history, keep a structured trading journal, use Turtle Analytics, and build transparent performance records for trader evaluation.",
    sections: [
      {
        title: "What Green Turtle Trades does",
        body:
          "Green Turtle Trades provides trading analytics, trader journal workflows, verified trader tools, and public performance summaries for traders who choose to publish leaderboard data. The platform focuses on risk, expectancy, consistency, trade history, and transparent trader evaluation.",
      },
      {
        title: "Turtle Analytics and trader records",
        body:
          "Turtle Analytics is the analytics product from Green Turtle Trades. It reviews historical trade data, R-multiple, win rate, drawdown, trade timing, risk behaviour, expectancy, and performance patterns so traders can understand their own trading record more clearly.",
      },
      {
        title: "Verified trader platform",
        body:
          "Green Turtle Trades is designed around transparent trader evaluation. Traders can keep raw trade and journal data private while choosing whether to publish summary performance on the public traders leaderboard.",
      },
      {
        title: "Green Turtle Trades and Green Turtle Traders",
        body:
          "Green Turtle Trades is the brand and legal company name. Green Turtle Traders is a common search variation connected to the official domain, greenturtletraders.co.uk. Both names refer to the same UK trading analytics and trader-backed investing platform operated by Green Turtle Trades Limited.",
      },
      {
        title: "Official website and source",
        body:
          "The official Green Turtle Trades website is https://greenturtletraders.co.uk. The main company overview page is https://greenturtletraders.co.uk/green-turtle-trades, with supporting pages for trading analytics, trading journal workflows, verified traders, Turtle Analytics, and the public traders leaderboard.",
      },
      {
        title: "Not the Turtle Trading strategy",
        body:
          "Green Turtle Trades is not the Turtle Trading strategy, the 1980s Turtle Trading experiment, or a historical trend-following rules system. The turtle reference is a brand play on the name. The platform itself is a modern trading analytics, trader verification, and trader-backed investing product.",
      },
      {
        title: "Not related to wildlife trade",
        body:
          "Green Turtle Trades is not related to green sea turtle wildlife trade, conservation, or animal products. The name refers to a trading technology company focused on trader analytics and performance transparency.",
      },
    ],
    faqs: [
      {
        question: "What is Green Turtle Trades?",
        answer:
          "Green Turtle Trades is a UK trading analytics and verified trader platform operated by Green Turtle Trades Limited, company number SC878660.",
      },
      {
        question: "Is Green Turtle Trades related to the Turtle Trading strategy?",
        answer:
          "No. Green Turtle Trades is not the Turtle Trading strategy, the Turtle Trading experiment, or a historical Turtle Trading rules site. The turtle wording is only part of the brand name.",
      },
      {
        question: "Is Green Turtle Trades related to green sea turtle trade?",
        answer:
          "No. Green Turtle Trades is a financial technology and trading analytics company. It is not connected to wildlife trade or sea turtle products.",
      },
      {
        question: "What is Turtle Analytics?",
        answer:
          "Turtle Analytics is the trading analytics product from Green Turtle Trades. It reviews trade history, risk, expectancy, performance patterns, journal records, and trader behaviour.",
      },
      {
        question: "What does Green Turtle Trades help traders do?",
        answer:
          "Green Turtle Trades helps traders review historical performance, keep a trading journal, analyze risk and expectancy, and build clearer performance records for trader evaluation.",
      },
      {
        question: "What is the official Green Turtle Trades website?",
        answer:
          "The official Green Turtle Trades website is https://greenturtletraders.co.uk.",
      },
      {
        question: "Is Green Turtle Traders the same as Green Turtle Trades?",
        answer:
          "Yes. Green Turtle Traders is a common search wording connected to the official domain greenturtletraders.co.uk. The brand name is Green Turtle Trades and the legal company name is Green Turtle Trades Limited.",
      },
    ],
  },
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
    title: "Trader Marketplace Built Around Verified Performance",
    eyebrow: "Trader Marketplace",
    description:
      "A trader marketplace built around verified trader performance, transparent metrics, trading analytics, and clearer investor decision-making.",
    keywords:
      "trader marketplace, trading marketplace, verified trader marketplace, trader performance marketplace, copy trading platform, trader-backed investing",
    intro:
      "A trader marketplace should make trader comparison clearer. Green Turtle Trades is building a transparent way to review trader records, risk, consistency, and public performance summaries before capital follows skill.",
    sections: [
      {
        title: "Compare traders with performance evidence",
        body:
          "Useful trader comparison needs more than headline gain. Win rate, expectancy, risk per trade, sample size, profit factor, drawdown, and consistency all matter when judging whether trader performance is repeatable.",
      },
      {
        title: "Public leaderboard summaries as a trust layer",
        body:
          "The public traders leaderboard gives visitors a transparent summary of opted-in trader performance while keeping raw trades private. This helps people compare traders without relying on screenshots, signal groups, or unsupported claims.",
      },
      {
        title: "Trading analytics behind trader evaluation",
        body:
          "Turtle Analytics and journal data help traders understand their own performance before that performance becomes part of a broader marketplace or investor evaluation workflow. The aim is to connect trader skill with investor attention through structured evidence.",
      },
      {
        title: "A clearer bridge between traders and capital",
        body:
          "Green Turtle Trades is not built around hype or one-off marketing. The long-term aim is a trader-backed investing platform where capital allocation can be informed by verified records, risk behaviour, and long-term performance data.",
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
        question: "Is a trader marketplace the same as copy trading?",
        answer:
          "Not necessarily. Copy trading usually focuses on following or allocating to traders. A trader marketplace should also help people evaluate trader quality with transparent performance records and risk metrics.",
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
    title: "Copy Trading Platform With Verified Trader Data",
    eyebrow: "Copy Trading",
    description:
      "A copy trading platform approach focused on verified trader performance, transparent risk metrics, public summaries, and clearer investor decision-making.",
    keywords:
      "copy trading platform, copy trading, copy trader, verified copy trading, transparent copy trading platform, copy trading alternative, trader-backed investing",
    intro:
      "Copy trading should be easier to evaluate before anyone follows a trader. Green Turtle Trades is designed around verified performance, risk visibility, and public trader summaries so people can judge records before capital follows skill.",
    sections: [
      {
        title: "Verified performance before allocation",
        body:
          "A stronger copy trading workflow starts with verified trader performance, not screenshots or unsupported claims. Public summary metrics and private analytics help explain whether a trader has consistency, expectancy, controlled risk, and enough trade history to be judged properly.",
      },
      {
        title: "Risk matters as much as return",
        body:
          "The goal is not simply to find traders with the biggest headline gain. Risk per trade, drawdown behaviour, sample size, expectancy, and win rate all help investors understand whether performance is sustainable.",
      },
      {
        title: "Transparency without exposing raw trades",
        body:
          "Green Turtle Trades can show public summary performance while keeping raw trade details private. CSV-imported trades are excluded from public leaderboard ranking because they are easier to edit outside the platform.",
      },
      {
        title: "A copy trading alternative focused on evidence",
        body:
          "Many copy trading platforms make trader performance visible, but not all performance summaries explain the risk behind the return. Green Turtle Trades is being built as a more evidence-led approach to trader-backed investing.",
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
        question: "Is Green Turtle Trades a copy trading platform?",
        answer:
          "Green Turtle Trades is building a trader-backed investing and analytics platform. It focuses on trader evaluation, public summaries, and verified records that can support better capital allocation decisions.",
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
    title: "Prop Firm Alternative for Trader-Backed Investing",
    eyebrow: "Prop Firm Alternative",
    description:
      "A transparent prop firm alternative focused on verified trader performance, trading analytics, risk records, and aligned investor capital.",
    keywords:
      "prop firm alternative, prop trading alternative, funded trader alternative, trader capital alternative, trading challenge alternative, trader-backed investing",
    intro:
      "Many traders want capital without relying only on short-term challenges or unclear incentives. Green Turtle Trades is building a more transparent prop firm alternative focused on verified data, responsible risk, and longer-term trader evidence.",
    sections: [
      {
        title: "Beyond one-off trading challenges",
        body:
          "A short challenge can miss the deeper question: can a trader manage risk and perform consistently over time? Green Turtle Trades focuses on richer performance evidence, including trade history, drawdown behaviour, expectancy, and consistency.",
      },
      {
        title: "Transparent metrics for serious traders",
        body:
          "Trading analytics, journal records, win rate, expectancy, risk control, and verified trade sample size create a better foundation for evaluating traders than pass-fail challenge outcomes alone.",
      },
      {
        title: "Investor capital with clearer alignment",
        body:
          "The platform is built around connecting capital and skill through transparency, not through opaque pass-fail rules that may not reflect long-term trading quality.",
      },
      {
        title: "A route for traders to build proof",
        body:
          "Green Turtle Trades helps traders build a structured record that can be reviewed over time. The aim is to make trader funding and investor-capital decisions more evidence-led.",
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
        question: "Is Green Turtle Trades a prop firm?",
        answer:
          "Green Turtle Trades is not positioned as a traditional challenge-based prop firm. It is building a trader-backed investing platform focused on verified performance, analytics, and clearer alignment between traders and capital.",
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
