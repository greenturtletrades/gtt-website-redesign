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
      "A trading journal for recording trades, reviewing decisions, tracking lessons, measuring expectancy, and understanding risk across your trading history.",
    keywords:
      "trading journal, trade journal, trading journal app, MT4 trading journal, MT5 trading journal, trading performance journal, trade notes, trading analytics journal",
    intro:
      "A trading journal is where traders turn trade history into feedback. Green Turtle Trades helps traders keep a structured record of entries, exits, notes, lessons, risk, account activity, and performance metrics so each trade becomes part of a clearer review process.",
    sections: [
      {
        title: "What a trading journal should record",
        body:
          "A useful trading journal should hold more than entry and exit prices. Traders should be able to review the symbol, direction, size, entry, exit, stop loss, take profit, risk, holding time, order type, setup, notes, lessons learned, and the market context around the decision.",
      },
      {
        title: "Review decisions as well as outcomes",
        body:
          "The point of a trading journal is not just to see whether a trade made money. It should help traders understand whether the trade followed the plan, whether risk was controlled, whether the exit was disciplined, and whether the same mistake keeps appearing over time.",
      },
      {
        title: "Connect journal data to Turtle Analytics",
        body:
          "Green Turtle Trades connects journal records with Turtle Analytics so traders can move from simple record keeping to deeper performance analysis across expectancy, profit factor, win rate, drawdown, holding time, R-multiple, best and worst trades, and risk behaviour.",
      },
      {
        title: "Import MT4, MT5, Trading 212, and CSV history",
        body:
          "A journal becomes more useful when trade history can be imported rather than manually rebuilt from memory. Turtle Analytics supports MetaTrader-connected workflows for MT4 and MT5 traders, Trading 212 history, and CSV imports where available, then brings that history into one structured review process.",
      },
      {
        title: "Measure expectancy and trading quality",
        body:
          "Journal metrics should show whether the trading process has a positive expected outcome. Expectancy, average win, average loss, win rate, risk/reward, profit factor, and average return help traders understand whether performance is repeatable or dependent on isolated trades.",
      },
      {
        title: "Track risk, drawdown, and exposure",
        body:
          "Green Turtle Trades treats risk as part of the journal, not a separate afterthought. Traders can review drawdown, risk per trade, open exposure, leverage where available, largest loss, missing stop-loss behaviour, and consistency signals across their own trading history.",
      },
      {
        title: "Private records, optional public summaries",
        body:
          "Journal data stays private by default. Raw trades, notes, account details, and personal records should not be exposed publicly. Traders may choose to publish controlled summary metrics, but public performance should be clearly labelled and methodology-backed.",
      },
      {
        title: "Built for beginners and serious traders",
        body:
          "Beginners can use a journal to build discipline and stop repeating avoidable mistakes. More experienced traders can use it to test whether a strategy is producing a real edge, whether risk is consistent, and whether behaviour changes across market conditions.",
      },
    ],
    faqs: [
      {
        question: "What should a trading journal include?",
        answer:
          "A trading journal should include entry and exit data, symbol, direction, position size, stop loss, take profit, risk, holding time, notes, trade lessons, market context, and performance metrics.",
      },
      {
        question: "Is a trading journal useful for beginners?",
        answer:
          "Yes. A journal helps new traders build discipline, review mistakes, and understand whether progress is based on repeatable behaviour.",
      },
      {
        question: "Can a trading journal connect to MT4 or MT5?",
        answer:
          "Turtle Analytics supports MetaTrader-connected workflows for MT4 and MT5 traders, alongside Trading 212 history and CSV import workflows where available.",
      },
      {
        question: "Which trading journal metrics matter most?",
        answer:
          "Useful journal metrics include expectancy, win rate, profit factor, average win, average loss, risk/reward, drawdown, risk per trade, holding time, and trade count.",
      },
      {
        question: "Does a trading journal predict future trades?",
        answer:
          "No. A trading journal reviews historical decisions and outcomes. It can help traders identify patterns and risks, but it does not predict market prices or guarantee returns.",
      },
      {
        question: "Are my journal trades public?",
        answer:
          "No. Raw journal trades, notes, and account details stay private by default. Only controlled summary stats can appear publicly if a trader enables public performance features.",
      },
    ],
  },
  {
    view: "seo-verified-traders",
    title: "Verified Traders",
    eyebrow: "Verified Traders",
    description:
      "Verified traders on Green Turtle Trades are evaluated through structured performance records, risk metrics, journal data, and transparent public summaries rather than screenshots alone.",
    keywords:
      "verified traders, verified trading performance, trader verification, transparent traders, verified trading records, trader performance verification, risk adjusted trader performance",
    intro:
      "Verified trader data matters because trust cannot be built from screenshots, claims, or isolated winning trades. Green Turtle Trades is designed around structured performance records, risk controls, trading analytics, journal data, and clearly labelled public summaries.",
    sections: [
      {
        title: "Why verified trader records matter",
        body:
          "A trader's headline return is not enough. A useful verification workflow should help explain whether results came from repeatable behaviour, responsible risk, a meaningful trade sample, and real trading history rather than edited screenshots or unsupported claims.",
      },
      {
        title: "What verification means",
        body:
          "Verification means a trading record is supported by platform-recorded activity, connected account data, imported broker history, MetaTrader-connected history, or in-house competition execution records. It does not mean Green Turtle Trades guarantees future performance or labels any trader as risk-free.",
      },
      {
        title: "Risk-adjusted performance, not only P/L",
        body:
          "Trader evaluation should look beyond profit and loss. Green Turtle Trades focuses on metrics such as win rate, expectancy, drawdown, profit factor, risk per trade, average hold time, open exposure, sample size, and consistency so users can understand the shape of performance.",
      },
      {
        title: "Performance without exposing raw trades",
        body:
          "Public trader profiles should show controlled summary performance while keeping raw trades, account details, private notes, and personal information protected. This gives visitors a clearer view of trader quality without exposing sensitive trading records.",
      },
      {
        title: "Connected to methodology",
        body:
          "The Green Turtle Trades methodology explains how data sources, realised and unrealised P/L, risk labels, duplicate trade handling, public summaries, and competition calculations should be treated. Verified trader pages should stay aligned with that methodology.",
      },
      {
        title: "Foundation for trader-backed investing",
        body:
          "Green Turtle Trades is building toward a trader-backed investing model where capital decisions can be informed by clearer evidence. Verified records, risk-adjusted analytics, and transparent summaries are the foundation for that future workflow.",
      },
      {
        title: "Limits of verification",
        body:
          "Verification does not remove trading risk. Historical performance can change, data can be incomplete, open positions can move quickly, and market conditions can shift. Public trader data is informational and should not be treated as financial advice.",
      },
    ],
    faqs: [
      {
        question: "What is a verified trader?",
        answer:
          "A verified trader is a trader whose performance can be reviewed through platform-recorded activity, connected account data, imported broker history, MetaTrader-connected records, or in-house competition execution data rather than unsupported claims alone.",
      },
      {
        question: "Does verified mean risk-free?",
        answer:
          "No. Verified means the record is supported by a data source. It does not mean future performance is guaranteed or that the trader is risk-free.",
      },
      {
        question: "Do verified traders publish every raw trade?",
        answer:
          "No. Raw trades, account details, and private notes stay private by default. Public pages should show controlled summary statistics such as return, win rate, expectancy, risk, drawdown, and trade count.",
      },
      {
        question: "Which metrics matter for trader verification?",
        answer:
          "Useful verification metrics include realised and unrealised return, win rate, expectancy, profit factor, drawdown, risk per trade, average hold time, sample size, exposure, and consistency.",
      },
      {
        question: "Why are CSV trades excluded from public ranking?",
        answer:
          "CSV files can be edited outside the platform, so they are not trusted for public leaderboard ranking calculations.",
      },
      {
        question: "Are verified trader summaries financial advice?",
        answer:
          "No. Public rankings, verified summaries, and trader analytics are informational and should not be treated as financial advice or guarantees of future results.",
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
      "An MT4 and MT5 trading journal for turning MetaTrader account history into structured notes, performance analytics, expectancy, drawdown, and risk review.",
    keywords:
      "MT4 trading journal, MT5 trading journal, MetaTrader trading journal, MetaTrader analytics, MT4 analytics, MT5 analytics, MetaTrader performance tracker, MT5 trade journal",
    intro:
      "MetaTrader account history shows what happened, but it rarely explains why it happened. Green Turtle Trades supports MetaTrader-connected workflows so MT4 and MT5 traders can turn trading history into journal records, analytics dashboards, risk review, and clearer performance feedback.",
    sections: [
      {
        title: "Turn MT4 and MT5 history into a journal workflow",
        body:
          "A MetaTrader trading journal should bring account history into a structured review process. Instead of only seeing tickets and account history rows, traders should be able to review symbol, direction, entry, exit, lot size, holding time, risk, result, notes, and lessons in one place.",
      },
      {
        title: "Account history is not enough",
        body:
          "MetaTrader account history is useful for raw execution records, but it does not usually provide the full decision context. A trading journal adds the missing layer: setup notes, trade rationale, exit quality, recurring mistakes, emotional triggers, risk behaviour, and whether a trade followed the plan.",
      },
      {
        title: "Analyze MetaTrader performance in Turtle Analytics",
        body:
          "Turtle Analytics can use MetaTrader-connected history to review win rate, expectancy, profit factor, average win, average loss, R-multiple, drawdown, risk per trade, average holding time, best and worst trades, and performance patterns across a trader's own historical record.",
      },
      {
        title: "Review risk and drawdown",
        body:
          "A strong MT4 or MT5 journal should make risk visible. Traders can review position sizing, leverage where available, drawdown, open exposure, largest loss, stop-loss behaviour, and whether risk stayed consistent across different market conditions.",
      },
      {
        title: "Private analytics and optional summaries",
        body:
          "MetaTrader-connected data can support private analytics and optional public summary performance. Raw trade records, account details, and private notes remain private by default, while public summaries should use controlled metrics and clearly labelled methodology.",
      },
      {
        title: "Useful for forex, indices, commodities, crypto, and CFDs",
        body:
          "MetaTrader is used across many markets. The journal workflow is designed around trade records and risk behaviour rather than one asset class, so traders can review performance across forex pairs, indices, commodities, crypto, and CFDs where their account history supports it.",
      },
    ],
    faqs: [
      {
        question: "What is an MT4 trading journal?",
        answer:
          "An MT4 trading journal is a structured record of MetaTrader 4 trade history, notes, risk, holding time, decision context, and performance metrics.",
      },
      {
        question: "What is an MT5 trading journal?",
        answer:
          "An MT5 trading journal helps MetaTrader 5 traders review account history through notes, analytics, risk metrics, expectancy, drawdown, and performance dashboards.",
      },
      {
        question: "How is a trading journal different from MetaTrader account history?",
        answer:
          "MetaTrader account history records executions and balances. A trading journal adds context, notes, lessons, risk review, strategy review, and performance analytics.",
      },
      {
        question: "Which MetaTrader metrics matter most?",
        answer:
          "Useful MetaTrader journal metrics include expectancy, win rate, profit factor, average win, average loss, R-multiple, drawdown, risk per trade, average hold time, best trade, worst trade, and sample size.",
      },
      {
        question: "Is MetaTrader data better than CSV for public ranking?",
        answer:
          "Connected account data is more trustworthy for public ranking than CSV files because CSV files can be edited outside the platform.",
      },
      {
        question: "Does a MetaTrader journal predict market prices?",
        answer:
          "No. A MetaTrader journal reviews historical trades and risk behaviour. It does not predict market prices or guarantee future returns.",
      },
    ],
  },
  {
    view: "seo-methodology",
    title: "Trader Verification Methodology",
    eyebrow: "Methodology",
    description:
      "Green Turtle Trades methodology for trader verification, trading analytics, risk metrics, public performance summaries, and university competition calculations.",
    keywords:
      "trader verification methodology, verified trading performance, trading analytics methodology, trader performance verification, trading risk metrics, Green Turtle Trades methodology",
    intro:
      "Green Turtle Trades uses structured trading records, account-level summaries, risk metrics, and clearly labelled public data to make trader performance easier to evaluate. This methodology explains how trader data is collected, what verification means, how core metrics are calculated, what information may be public, and where the limits of the data are.",
    sections: [
      {
        title: "What verification means",
        body:
          "Verification means a trading record is supported by platform-recorded activity, connected account data, imported trade history, or in-house competition execution records. It does not mean Green Turtle Trades guarantees future performance, approves a trader as risk-free, or verifies every external statement a trader may make outside the platform.",
      },
      {
        title: "Data sources",
        body:
          "Green Turtle Trades can use several data sources depending on the product area: in-house competition orders and executions, trader journal records, imported broker history, MetaTrader-connected history, account balance records, and platform activity logs. Pages should state whether data is from live platform records, imported history, or public competition summaries.",
      },
      {
        title: "Public and private information",
        body:
          "Raw trade history, account details, personal information, and private journal notes should remain private unless a user or competition rule explicitly makes a summary public. Public pages should use summary statistics such as score, return, win rate, risk label, trade count, university ranking, and competition activity rather than exposing sensitive account data.",
      },
      {
        title: "Core performance metrics",
        body:
          "Common metrics include realised return, unrealised return, total return, win rate, average return, profit factor, expectancy, drawdown, holding time, trade count, and risk score. Metrics should be calculated from the relevant account or competition dataset rather than being manually re-entered in the frontend.",
      },
      {
        title: "Return and P/L treatment",
        body:
          "Realised P/L should come from closed trades. Unrealised P/L should come from open positions using the latest available market mark. Total P/L combines realised and unrealised values where appropriate. If a page is based only on closed journal trades, it should be labelled as realised or journal-based rather than presented as full account P/L.",
      },
      {
        title: "Risk and drawdown",
        body:
          "Risk analysis should consider drawdown, average risk per trade, leverage where available, missing stop-loss behaviour, open exposure, largest loss, and concentration. Drawdown should measure the fall from a previous equity high to a later low in the relevant dataset. Risk labels are summary indicators, not investment recommendations.",
      },
      {
        title: "University competition calculations",
        body:
          "University competition rankings use in-house competition data and central scoring logic. Individual scores, university scores, active participation, realised and unrealised return, backers, risk labels, and trade activity should come from the central competition calculation source so public pages, the app, and admin views do not drift apart.",
      },
      {
        title: "Data quality and duplication controls",
        body:
          "Where trade records can arrive from more than one source, calculations should avoid counting duplicate executions as separate trades. Trade matching should use stable identifiers where available and fall back to consistent fingerprints based on symbol, direction, size, entry time, exit time, and execution details.",
      },
      {
        title: "Limitations",
        body:
          "Verification and analytics depend on the available data. Missing broker fields, delayed market prices, imported file errors, duplicated records, timezone differences, and open positions can affect reported metrics. Green Turtle Trades should label data sources and update methodology notes when calculation rules materially change.",
      },
      {
        title: "Methodology version",
        body:
          "This methodology is a public summary for Green Turtle Trades website and competition reporting. Methodology version 1.0 was published in August 2026 and should be reviewed whenever scoring, verification, data-source, or risk-calculation logic changes.",
      },
    ],
    faqs: [
      {
        question: "Does verified performance guarantee future returns?",
        answer:
          "No. Verified performance means the record is supported by platform, account, import, or competition data. Historical performance does not guarantee future performance.",
      },
      {
        question: "Does Green Turtle Trades publish raw account data?",
        answer:
          "Public pages should use summary metrics and leaderboard information. Raw account details, personal information, and private journal notes should not be exposed publicly unless a specific product rule or user permission allows it.",
      },
      {
        question: "How should realised and unrealised P/L be handled?",
        answer:
          "Realised P/L comes from closed trades. Unrealised P/L comes from open positions using the latest available market mark. Total P/L combines them only when the page is representing full account performance.",
      },
      {
        question: "Why does methodology matter for trader verification?",
        answer:
          "A clear methodology helps users understand where the data comes from, what each metric means, and what limitations apply before comparing traders or competition results.",
      },
      {
        question: "Are public rankings financial advice?",
        answer:
          "No. Public rankings, analytics, trader summaries, and competition data are informational and should not be treated as financial advice or guarantees of future results.",
      },
    ],
  },
  {
    view: "seo-investment-competition",
    title: "Investment Competition",
    eyebrow: "Investment Competition",
    description:
      "A public investment competition from Green Turtle Trades where Scottish university students trade virtual capital, build practical market experience, and compete on transparent rankings.",
    keywords:
      "investment competition, investing competition, trading competition, university investment competition, student investment competition, virtual investment competition, Green Turtle Trades competition",
    intro:
      "The Green Turtle Trades investment competition gives students a practical way to learn markets without risking personal capital. Competitors trade with virtual market capital, follow clear rules, and appear on transparent leaderboards powered by in-house execution data.",
    sections: [
      {
        title: "A risk-free way to learn practical investing",
        body:
          "An investment competition should reward process as well as outcome. Green Turtle Trades gives competitors virtual capital so they can learn position sizing, risk control, market behaviour, and portfolio discipline before real money is involved.",
      },
      {
        title: "Rankings based on more than return",
        body:
          "The competition leaderboard considers return, win rate, active participation, risk, drawdown, and trader-backing activity. This helps prevent pure high-risk speculation from dominating the ranking.",
      },
      {
        title: "Public university and trader leaderboards",
        body:
          "Visitors can follow the public university competition leaderboard, compare top student traders, and see how universities rank against each other during the competition.",
      },
    ],
    faqs: [
      {
        question: "What is an investment competition?",
        answer:
          "An investment competition is a structured challenge where competitors manage virtual or real capital and are ranked by performance, risk, activity, and other rules.",
      },
      {
        question: "Does the Green Turtle Trades competition use real money?",
        answer:
          "Competitors use virtual capital in the university competition, so students can gain practical experience without risking personal money.",
      },
      {
        question: "How are competitors ranked?",
        answer:
          "Competitors are ranked using a balanced scoring model covering return, win rate, participation, risk control, drawdown, and competition activity.",
      },
    ],
  },
  {
    view: "seo-student-investing-competition",
    title: "Student Investing Competition",
    eyebrow: "Student Investing",
    description:
      "A student investing competition for Scottish universities, helping students learn trading, portfolio discipline, risk control, and market decision-making with virtual capital.",
    keywords:
      "student investing competition, student investment competition, university investing competition, Scottish student trading competition, student trading challenge, university finance competition",
    intro:
      "The Green Turtle Trades student investing competition is designed for students who want practical market experience. It gives university competitors a risk-free environment to trade, track performance, and learn how discipline affects results.",
    sections: [
      {
        title: "Built for Scottish university students",
        body:
          "The competition is focused on Scottish universities and creates a public way for students to represent their university while learning practical investing skills.",
      },
      {
        title: "Learning by doing",
        body:
          "Students can place market trades, review performance, understand drawdown, and see how their decisions affect both individual and university rankings.",
      },
      {
        title: "Transparent performance and risk",
        body:
          "The leaderboard shows summary metrics such as score, return, win rate, risk, backers, and trade count so performance can be understood in context.",
      },
    ],
    faqs: [
      {
        question: "Who can join the student investing competition?",
        answer:
          "The competition is designed for participating university students, with university identity linked through approved student email domains.",
      },
      {
        question: "Why use virtual capital?",
        answer:
          "Virtual capital lets students learn market behaviour, portfolio discipline, and risk management without personal financial loss.",
      },
      {
        question: "Can visitors see the leaderboard?",
        answer:
          "Yes. The public website shows the university competition leaderboard, while account actions remain inside the secure competition app.",
      },
    ],
  },
  {
    view: "seo-virtual-trading-competition",
    title: "Virtual Trading Competition",
    eyebrow: "Virtual Trading",
    description:
      "A virtual trading competition where students use demo capital, compete on live rankings, and learn investing discipline through market execution data.",
    keywords:
      "virtual trading competition, virtual investing competition, demo trading competition, paper trading competition, student virtual trading, risk free trading competition",
    intro:
      "A virtual trading competition helps people practise market decision-making before real money is on the line. Green Turtle Trades uses virtual competition capital, transparent scoring, and public ranking data to make student investing more practical and measurable.",
    sections: [
      {
        title: "Practice without personal financial risk",
        body:
          "Competitors can learn how trades move, how risk compounds, and how position decisions affect performance while using virtual funds rather than personal savings.",
      },
      {
        title: "Live rankings from competition data",
        body:
          "Public rankings are powered by in-house competition execution history, so leaderboard metrics come from the same data used inside the competition platform.",
      },
      {
        title: "A bridge between education and markets",
        body:
          "The aim is to help students move beyond theory by building a measurable record of investment decisions, risk habits, and performance improvement.",
      },
    ],
    faqs: [
      {
        question: "What is a virtual trading competition?",
        answer:
          "A virtual trading competition ranks competitors who trade with demo or virtual capital instead of risking personal money.",
      },
      {
        question: "Is virtual trading useful for beginners?",
        answer:
          "Yes. It gives beginners practical exposure to market decisions, risk, and performance tracking before real capital is involved.",
      },
      {
        question: "Does Green Turtle Trades show public rankings?",
        answer:
          "Yes. The website publishes public leaderboard summaries for the university competition, including individual and university rankings.",
      },
    ],
  },
];

export function getSeoContentPage(view: ViewType) {
  return seoContentPages.find((page) => page.view === view) || null;
}
