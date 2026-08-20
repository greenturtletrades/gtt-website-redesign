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
      "Trading analytics helps traders review trade history, expectancy, win rate, profit factor, drawdown, risk per trade, holding time, and performance behaviour with clearer data.",
    keywords:
      "trading analytics, trading performance analytics, trading analytics platform, trade analytics, trading performance analysis, trader analytics, trading statistics, Turtle Analytics",
    intro:
      "Trading analytics turns trade history into evidence. Green Turtle Trades gives traders a clearer way to understand performance by connecting account history, journal records, risk metrics, and Turtle Analytics dashboards.",
    sections: [
      {
        title: "What trading analytics means",
        body:
          "Trading analytics is the process of reviewing trade history, risk, return, timing, behaviour, and consistency to understand how a trader is actually performing. It should explain the pattern behind the results rather than only showing an account balance.",
      },
      {
        title: "Different from a journal or tracker",
        body:
          "A trading journal records decisions, notes, and lessons. A performance tracker summarizes results. Trading analytics goes further by connecting those records to deeper metrics, behaviour patterns, risk quality, and possible areas for improvement.",
      },
      {
        title: "Performance data built around real trading history",
        body:
          "Good trading analytics should explain what is happening across actual trades, not rely on screenshots or headline returns. Turtle Analytics reviews recorded trade history so traders can understand where performance is strong, where risk is too high, and which behaviours need attention.",
      },
      {
        title: "Core analytics metrics",
        body:
          "Useful trading analytics include expectancy, win rate, R-multiple, profit factor, average win, average loss, risk/reward, risk per trade, drawdown, holding time, trade count, best trade, worst trade, sample size, and consistency.",
      },
      {
        title: "Risk-adjusted performance",
        body:
          "Raw P/L can be misleading if it was produced by oversized positions, high leverage, or a single outlier trade. Green Turtle Trades reviews performance alongside drawdown, open exposure, stop-loss behaviour, leverage where available, and risk consistency.",
      },
      {
        title: "Data sources for analytics",
        body:
          "Turtle Analytics can support analytics workflows from journal records, platform activity, MetaTrader-connected MT4 and MT5 history, Trading 212 history, and CSV imports where available. Public summaries should always make the data source and calculation method clear.",
      },
      {
        title: "Realised and unrealised performance",
        body:
          "Analytics should distinguish realised performance from closed trades and unrealised performance from open positions. That separation helps prevent confusion between completed results and live exposure.",
      },
      {
        title: "Private analytics, optional public summaries",
        body:
          "Raw trade data, account details, and notes remain private by default. Traders can choose to publish controlled summary performance where supported, while public metrics should follow methodology-backed calculations.",
      },
      {
        title: "Trading analytics for evaluation",
        body:
          "Green Turtle Trades uses analytics to support clearer trader evaluation. Verified summaries, competition rankings, and future trader-backed investing workflows should be based on structured performance evidence rather than unsupported claims.",
      },
    ],
    faqs: [
      {
        question: "What is trading analytics?",
        answer:
          "Trading analytics is the process of reviewing trade history, risk, return, expectancy, win rate, drawdown, timing, and behaviour patterns to understand trading performance.",
      },
      {
        question: "How is trading analytics different from a trading journal?",
        answer:
          "A trading journal records decisions, notes, and lessons. Trading analytics turns those records into metrics and patterns such as expectancy, drawdown, profit factor, and risk behaviour.",
      },
      {
        question: "Which trading analytics metrics matter most?",
        answer:
          "Useful metrics include expectancy, win rate, R-multiple, profit factor, average win, average loss, risk per trade, drawdown, holding time, sample size, and consistency.",
      },
      {
        question: "Can Turtle Analytics use MT4 or MT5 history?",
        answer:
          "Turtle Analytics supports MetaTrader-connected workflows for MT4 and MT5 traders, alongside Trading 212 history and CSV import workflows where available.",
      },
      {
        question: "Does Turtle Analytics predict market prices?",
        answer:
          "No. Turtle Analytics focuses on historical trade behaviour and performance analysis. It does not make market predictions or guarantee returns.",
      },
      {
        question: "Should analytics include open positions?",
        answer:
          "Open positions can be included when reviewing full account exposure, but unrealised performance should be labelled separately from realised closed-trade performance.",
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
      "A trading journal for recording trades, reviewing decisions, importing MT4 and MT5 history, tracking lessons, measuring expectancy, and understanding trading risk.",
    keywords:
      "trading journal, trade journal, trading journal software, trading journal app, MT4 trading journal, MT5 trading journal, trading performance journal, trade notes, trading analytics journal",
    intro:
      "A trading journal is where traders turn trade history into feedback. Green Turtle Trades helps traders keep a structured record of entries, exits, notes, lessons, risk, account activity, and performance metrics so each trade becomes part of a clearer review process.",
    sections: [
      {
        title: "What a trading journal should record",
        body:
          "A useful trading journal should hold more than entry and exit prices. Traders should be able to review the symbol, direction, size, entry, exit, stop loss, take profit, risk, holding time, order type, setup, notes, lessons learned, and the market context around the decision.",
      },
      {
        title: "Why spreadsheets and screenshots are weak",
        body:
          "Spreadsheets can be useful at the start, but they often become hard to maintain and easy to misread. Screenshots are even weaker because they can be selective and rarely show risk, sizing, context, or the full account history. A structured journal keeps the record more consistent.",
      },
      {
        title: "Review decisions as well as outcomes",
        body:
          "The point of a trading journal is not just to see whether a trade made money. It should help traders understand whether the trade followed the plan, whether risk was controlled, whether the exit was disciplined, and whether the same mistake keeps appearing over time.",
      },
      {
        title: "Build a review process",
        body:
          "A journal is most useful when traders review it regularly. Weekly and monthly reviews can show which setups are working, which symbols create avoidable losses, whether risk is drifting, and whether trades are being taken for clear reasons or emotional reactions.",
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
        title: "Separate realised and unrealised performance",
        body:
          "Closed trades and open positions should not be mixed without labels. Realised performance comes from closed trades, while unrealised performance depends on open positions and current market marks. Clear labels help prevent account numbers from drifting across different screens.",
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
      {
        title: "A private record that can support public proof",
        body:
          "The private journal is for honest review. If a trader later chooses to publish a performance summary, the public version should use controlled metrics, clear data-source labels, and methodology-backed calculations rather than exposing private notes or unsupported claims.",
      },
    ],
    faqs: [
      {
        question: "What should a trading journal include?",
        answer:
          "A trading journal should include entry and exit data, symbol, direction, position size, stop loss, take profit, risk, holding time, notes, trade lessons, market context, and performance metrics.",
      },
      {
        question: "Is a trading journal better than a spreadsheet?",
        answer:
          "A spreadsheet can work for simple tracking, but a structured trading journal is better for combining notes, risk, imported history, review workflows, and analytics in one place.",
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
        question: "Should a trading journal include open positions?",
        answer:
          "Open positions can be included, but unrealised performance should be labelled separately from realised closed-trade performance.",
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
      "Track trading performance with metrics such as win rate, expectancy, R-multiple, profit factor, risk per trade, drawdown, holding time, trade count, and consistency.",
    keywords:
      "trading performance tracker, trading performance, trade tracker, trading metrics, track trading performance, trading statistics, trading dashboard, trader performance analytics",
    intro:
      "A trading performance tracker helps traders understand whether their results are consistent, risk-aware, and repeatable. Green Turtle Trades combines performance tracking with journal records, account history, risk analytics, and Turtle Analytics dashboards.",
    sections: [
      {
        title: "What a trading performance tracker does",
        body:
          "A trading performance tracker records and summarizes trading results so traders can review the full pattern behind their trades. It should show more than account balance by connecting trade outcomes, risk, timing, notes, and behaviour.",
      },
      {
        title: "Track the metrics that explain performance",
        body:
          "Win rate, expectancy, R-multiple, profit factor, average win, average loss, risk/reward, risk per trade, drawdown, holding time, trade count, best trade, worst trade, and sample size all help explain whether trading results come from a repeatable edge.",
      },
      {
        title: "Sample size and consistency matter",
        body:
          "A small number of winning trades can create misleading confidence. A useful performance tracker should help traders judge whether results are backed by enough trades, whether wins and losses are consistent, and whether one outlier trade is doing too much of the work.",
      },
      {
        title: "Connect results to behaviour",
        body:
          "Performance tracking is most useful when it links results to trader behaviour, notes, timing, market conditions, setup quality, and risk decisions. Green Turtle Trades connects tracking with journal records so traders can review both the result and the decision process.",
      },
      {
        title: "Track realised and unrealised performance clearly",
        body:
          "Performance pages should distinguish realised P/L from closed trades and unrealised P/L from open positions. Total performance is clearer when the source of each figure is labelled and calculated consistently.",
      },
      {
        title: "Review risk-adjusted performance",
        body:
          "Raw return is not enough. Turtle Analytics helps traders review performance alongside drawdown, risk per trade, exposure, leverage where available, profit factor, and expectancy so performance quality is easier to evaluate.",
      },
      {
        title: "Private tracking and optional public summaries",
        body:
          "Private tracking can include raw trades, notes, account history, and journal records. Public summaries should use controlled metrics such as return, win rate, trade count, risk, and drawdown without exposing private account details.",
      },
      {
        title: "Turn tracking into improvement",
        body:
          "Turtle Analytics helps traders move from simple tracking to deeper analysis by showing patterns across trade history, risk behaviour, holding time, market exposure, and recurring mistakes.",
      },
    ],
    faqs: [
      {
        question: "What is a trading performance tracker?",
        answer:
          "A trading performance tracker records and summarizes trading results so traders can review metrics such as win rate, expectancy, risk, drawdown, holding time, and trade history.",
      },
      {
        question: "Which trading metrics matter most?",
        answer:
          "Useful metrics include expectancy, win rate, R-multiple, profit factor, average win, average loss, risk per trade, drawdown, holding time, sample size, and consistency.",
      },
      {
        question: "How is a performance tracker different from a trading journal?",
        answer:
          "A trading journal records trade context, notes, and lessons. A performance tracker summarizes the metrics across those trades. The strongest workflow connects both.",
      },
      {
        question: "Why does sample size matter in trading performance?",
        answer:
          "Small samples can be misleading. More trade history makes it easier to judge whether performance is repeatable or driven by a few outlier trades.",
      },
      {
        question: "Can performance tracking help risk management?",
        answer:
          "Yes. Tracking risk per trade and drawdown behaviour helps traders identify when risk is too high or inconsistent.",
      },
      {
        question: "Should unrealised P/L be included in performance tracking?",
        answer:
          "Unrealised P/L can be included when a page represents full account performance, but it should be labelled separately from realised P/L from closed trades.",
      },
      {
        question: "Does performance tracking guarantee future returns?",
        answer:
          "No. Performance tracking reviews historical trading behaviour. It does not predict markets or guarantee future returns.",
      },
    ],
  },
  {
    view: "seo-trading-risk-management",
    title: "Trading Risk Management",
    eyebrow: "Risk Management",
    description:
      "Trading risk management tools and analytics for reviewing risk per trade, drawdown, exposure, stop-loss behaviour, leverage, expectancy, and trader consistency.",
    keywords:
      "trading risk management, risk management trading, trading risk analytics, risk per trade, trading drawdown, stop loss analytics, trading exposure, risk reward ratio",
    intro:
      "Risk management is central to serious trading. Green Turtle Trades helps traders review risk per trade, drawdown behaviour, open exposure, stop-loss discipline, leverage where available, expectancy, and performance consistency.",
    sections: [
      {
        title: "Risk is part of every trade",
        body:
          "Every trade has risk. The question is whether that risk is measured, controlled, and consistent with the trader's edge, account size, and trading plan. A trader can have strong returns and still be fragile if the risk behind those returns is uncontrolled.",
      },
      {
        title: "Risk per trade",
        body:
          "Risk per trade shows how much of the account is exposed if a trade fails. Reviewing this metric across a full trade history helps traders see whether they are sizing positions consistently or allowing one trade to carry too much account risk.",
      },
      {
        title: "Drawdown and largest loss",
        body:
          "Drawdown shows how far performance falls from a previous equity high. Largest loss shows how much damage one trade created. Together, they help traders understand whether returns are being earned with acceptable downside or with hidden blow-up risk.",
      },
      {
        title: "Stop-loss behaviour and risk/reward",
        body:
          "A risk workflow should show whether trades have planned exits, whether stop-loss behaviour is consistent, and whether average reward is large enough compared with average risk. Win rate alone is not enough without understanding risk/reward.",
      },
      {
        title: "Open exposure and leverage",
        body:
          "Risk does not only exist in closed trades. Open exposure, correlated positions, leverage where available, and concentrated symbols can all increase account vulnerability. Turtle Analytics helps traders review exposure alongside realised performance.",
      },
      {
        title: "Use analytics to spot weak risk habits",
        body:
          "Trading analytics can highlight oversized risk, weak setups, poor reward-to-risk behaviour, overtrading, long hold times, missing stop-loss patterns, and conditions where a trader tends to underperform.",
      },
      {
        title: "Risk-adjusted trader evaluation",
        body:
          "Green Turtle Trades treats risk as part of performance quality. Verified summaries, trader comparisons, and competition scoring should consider return alongside drawdown, sample size, exposure, and risk consistency rather than rewarding raw P/L alone.",
      },
      {
        title: "Public rankings reward controlled risk",
        body:
          "Public rankings and competition scoring should reward controlled risk because responsible risk control supports more sustainable performance. Risk labels are summary indicators, not financial advice or guarantees of future returns.",
      },
    ],
    faqs: [
      {
        question: "What is trading risk management?",
        answer:
          "Trading risk management is the process of controlling position size, risk per trade, drawdown, exposure, stop-loss behaviour, leverage, and decision quality across trades.",
      },
      {
        question: "Why is risk per trade important?",
        answer:
          "Risk per trade shows how much a trader is exposing on each position. Consistent risk helps make performance easier to evaluate.",
      },
      {
        question: "What is trading drawdown?",
        answer:
          "Drawdown measures how far an account or strategy falls from a previous equity high to a later low. It helps show downside risk behind the returns.",
      },
      {
        question: "Why is risk/reward important?",
        answer:
          "Risk/reward compares how much a trader risks against the potential or realised reward. A high win rate can still be weak if losses are much larger than wins.",
      },
      {
        question: "Should open positions be included in risk review?",
        answer:
          "Yes. Open positions affect exposure, unrealised P/L, leverage, and concentration risk, so they should be reviewed alongside closed-trade performance.",
      },
      {
        question: "Can analytics improve trading risk management?",
        answer:
          "Analytics can reveal patterns in losses, drawdowns, trade duration, stop placement, exposure, oversized trades, and conditions where risk tends to increase.",
      },
      {
        question: "Are risk labels investment advice?",
        answer:
          "No. Risk labels and analytics are informational summaries. They are not financial advice and do not guarantee future performance.",
      },
    ],
  },
  {
    view: "seo-trading-expectancy",
    title: "Trading Expectancy",
    eyebrow: "Trading Metrics",
    description:
      "Trading expectancy explained: formula, examples, win rate, average win, average loss, risk/reward, sample size, and how Turtle Analytics reviews expectancy.",
    keywords:
      "trading expectancy, expectancy trading, trading expectancy formula, trade expectancy, expectancy calculator trading, win rate risk reward, trading metrics",
    intro:
      "Trading expectancy helps traders understand the average expected outcome of a trade over a series of trades. It connects win rate, average win, average loss, risk/reward, and sample size into one practical performance metric.",
    sections: [
      {
        title: "What trading expectancy means",
        body:
          "Trading expectancy estimates the average result a trader can expect per trade based on historical outcomes. It is useful because it looks beyond whether a trader wins often and asks whether the size of wins is large enough compared with the size of losses.",
      },
      {
        title: "Trading expectancy formula",
        body:
          "A common formula is: expectancy = (win rate x average win) - (loss rate x average loss). For example, if a trader wins 50% of trades, averages £120 on winners, and loses £70 on losers, expectancy is (0.50 x 120) - (0.50 x 70) = £25 per trade.",
      },
      {
        title: "Why win rate alone is not enough",
        body:
          "A trader can have a high win rate and still lose money if losses are much larger than wins. A trader can also have a lower win rate and still be profitable if average wins are meaningfully larger than average losses.",
      },
      {
        title: "Expectancy and risk/reward",
        body:
          "Expectancy connects directly to risk/reward. When a trader risks £100 to make £50, the win rate needs to be much higher than when a trader risks £100 to make £200. The relationship between win rate and average win/loss size is what expectancy makes visible.",
      },
      {
        title: "Expectancy needs sample size",
        body:
          "Expectancy is more useful when it is based on enough trades. A small sample can be distorted by one large win or loss, while a larger sample gives a clearer view of whether the trading process has a repeatable edge.",
      },
      {
        title: "Account expectancy and R-multiple expectancy",
        body:
          "Expectancy can be reviewed in currency terms, percentage terms, or R-multiple terms. R-multiple expectancy can be helpful because it normalizes outcomes by the amount risked on each trade.",
      },
      {
        title: "How Turtle Analytics uses expectancy",
        body:
          "Turtle Analytics connects expectancy with journal records, trade history, risk per trade, drawdown, holding time, and setup behaviour. That helps traders see whether expectancy is coming from disciplined repeatable decisions or from isolated outlier trades.",
      },
      {
        title: "Limitations of expectancy",
        body:
          "Expectancy is based on historical data. It does not predict future trades, remove market risk, or guarantee returns. It should be reviewed alongside drawdown, exposure, sample size, and risk consistency.",
      },
    ],
    faqs: [
      {
        question: "What is trading expectancy?",
        answer:
          "Trading expectancy is the average expected outcome per trade based on win rate, average win, loss rate, and average loss.",
      },
      {
        question: "What is the trading expectancy formula?",
        answer:
          "A common formula is expectancy = (win rate x average win) - (loss rate x average loss).",
      },
      {
        question: "Can a trader be profitable with a low win rate?",
        answer:
          "Yes. A trader can be profitable with a lower win rate if average wins are large enough compared with average losses.",
      },
      {
        question: "Why is expectancy better than win rate alone?",
        answer:
          "Win rate only shows how often trades win. Expectancy also considers the size of wins and losses, which gives a clearer view of performance quality.",
      },
      {
        question: "Does positive expectancy guarantee future returns?",
        answer:
          "No. Positive historical expectancy does not guarantee future results. Market conditions, risk behaviour, sample size, and execution can all change.",
      },
      {
        question: "How does Turtle Analytics review expectancy?",
        answer:
          "Turtle Analytics reviews expectancy alongside trade history, journal records, risk per trade, drawdown, holding time, and other performance metrics.",
      },
    ],
  },
  {
    view: "seo-trading-drawdown",
    title: "Trading Drawdown",
    eyebrow: "Trading Metrics",
    description:
      "Trading drawdown explained: max drawdown, equity high to low, realised and unrealised drawdown, recovery math, risk control, and how Turtle Analytics reviews drawdown.",
    keywords:
      "trading drawdown, max drawdown trading, maximum drawdown, drawdown meaning trading, drawdown calculator trading, equity drawdown, trading risk management",
    intro:
      "Trading drawdown shows how far an account, strategy, or trader falls from a previous equity high. It is one of the most important risk metrics because it reveals the downside behind a return figure.",
    sections: [
      {
        title: "What trading drawdown means",
        body:
          "Drawdown measures the fall from a previous equity peak to a later low. If an account rises to £110,000 and then falls to £100,000 before recovering, the drawdown from that peak is £10,000 or about 9.09%.",
      },
      {
        title: "Maximum drawdown",
        body:
          "Maximum drawdown is the largest peak-to-trough fall in the period being reviewed. It helps traders and evaluators understand the worst historical downside in a trading record.",
      },
      {
        title: "Drawdown is different from one losing trade",
        body:
          "A single losing trade can contribute to drawdown, but drawdown measures the account-level decline across a sequence of trades or open positions. It captures the combined effect of losses, exposure, and unrecovered equity.",
      },
      {
        title: "Realised and unrealised drawdown",
        body:
          "Realised drawdown comes from closed losses and account history. Unrealised drawdown can come from open positions moving against the trader. A full risk review should make clear whether drawdown includes open trade marks or only closed performance.",
      },
      {
        title: "Why drawdown matters more than headline return",
        body:
          "Two traders can both make 10%, but one may have experienced a 2% drawdown while another went through a 25% drawdown. The return number alone does not show how much downside risk was taken to reach it.",
      },
      {
        title: "Recovery math",
        body:
          "The deeper a drawdown becomes, the larger the return needed to recover. A 10% drawdown needs about 11.1% to recover, while a 50% drawdown needs 100% to recover. This is why controlling downside matters.",
      },
      {
        title: "How Turtle Analytics reviews drawdown",
        body:
          "Turtle Analytics reviews drawdown alongside trade history, risk per trade, open exposure, leverage where available, holding time, expectancy, and journal records. That helps traders see whether drawdown came from normal strategy variance or weak risk behaviour.",
      },
      {
        title: "Limitations of drawdown",
        body:
          "Drawdown is based on available historical data. It does not predict the next loss, remove trading risk, or guarantee that future drawdown will be smaller. It should be reviewed with sample size, exposure, risk consistency, and market context.",
      },
    ],
    faqs: [
      {
        question: "What is drawdown in trading?",
        answer:
          "Drawdown in trading is the decline from a previous account or strategy equity high to a later low.",
      },
      {
        question: "What is maximum drawdown?",
        answer:
          "Maximum drawdown is the largest peak-to-trough decline over the period being measured.",
      },
      {
        question: "Why is drawdown important?",
        answer:
          "Drawdown shows the downside risk behind returns. It helps traders understand how much equity was lost before recovery.",
      },
      {
        question: "Is drawdown the same as a loss?",
        answer:
          "No. A loss is usually a single trade or realised outcome. Drawdown measures the wider equity decline from a previous high.",
      },
      {
        question: "Should open positions count toward drawdown?",
        answer:
          "Open positions can affect unrealised drawdown. Pages should label whether drawdown includes open trade marks or only closed-trade performance.",
      },
      {
        question: "Does low drawdown guarantee a safe trader?",
        answer:
          "No. Low historical drawdown does not guarantee future safety. Drawdown should be reviewed alongside exposure, sample size, leverage, risk per trade, and market conditions.",
      },
    ],
  },
  {
    view: "seo-profit-factor-trading",
    title: "Profit Factor in Trading",
    eyebrow: "Trading Metrics",
    description:
      "Profit factor in trading explained: formula, gross profit, gross loss, sample size, win rate, expectancy, drawdown, and how Turtle Analytics reviews profit factor.",
    keywords:
      "profit factor trading, trading profit factor, profit factor formula, good profit factor trading, gross profit gross loss, trading metrics, Turtle Analytics",
    intro:
      "Profit factor shows how much gross profit a trader generated for every unit of gross loss. It is a useful trading metric because it connects winning trades and losing trades into one simple ratio, but it needs sample size and risk context to be meaningful.",
    sections: [
      {
        title: "What profit factor means",
        body:
          "Profit factor compares total profits from winning trades with total losses from losing trades. A profit factor above 1.0 means gross profits were larger than gross losses over the period being reviewed. A profit factor below 1.0 means losses were larger than profits.",
      },
      {
        title: "Profit factor formula",
        body:
          "The common formula is: profit factor = gross profit / absolute gross loss. For example, if a trader made $1,500 from winning trades and lost $750 from losing trades, the profit factor is 2.0.",
      },
      {
        title: "Why gross profit and gross loss matter",
        body:
          "Profit factor uses gross totals rather than net profit alone. That matters because two traders can have the same net profit but very different risk profiles. One may have smooth gains and controlled losses, while another may swing through large wins and large losses.",
      },
      {
        title: "What is a good profit factor?",
        body:
          "A profit factor above 1.0 is positive historically, but it does not automatically mean the strategy is strong. A very high profit factor can be distorted by a small trade sample, one large outlier, or a period with no meaningful losses.",
      },
      {
        title: "Profit factor needs sample size",
        body:
          "Profit factor is more useful when there are enough closed trades. With only a few trades, the ratio can move sharply after one win or one loss. Sample size, trade count, and consistency should always be reviewed alongside profit factor.",
      },
      {
        title: "Profit factor vs win rate",
        body:
          "Win rate shows how often trades win. Profit factor shows whether the wins were large enough compared with the losses. A trader can have a lower win rate and a strong profit factor if average wins are much larger than average losses.",
      },
      {
        title: "Profit factor vs expectancy",
        body:
          "Expectancy estimates the average outcome per trade. Profit factor compares total winning output with total losing output. Both metrics are useful, but expectancy is usually better for understanding the average trade and profit factor is useful for understanding aggregate payoff quality.",
      },
      {
        title: "How Turtle Analytics reviews profit factor",
        body:
          "Turtle Analytics reviews profit factor alongside win rate, average win, average loss, expectancy, drawdown, holding time, risk per trade, and sample size. In the journal workflow, profit factor is calculated from winning outcomes divided by the absolute value of losing outcomes when enough loss data exists.",
      },
      {
        title: "Limitations of profit factor",
        body:
          "Profit factor is based on historical results. It does not predict future trades, remove market risk, or guarantee future performance. It should be read with drawdown, exposure, trade count, and risk consistency.",
      },
    ],
    faqs: [
      {
        question: "What is profit factor in trading?",
        answer:
          "Profit factor is the ratio of gross profit from winning trades to the absolute gross loss from losing trades.",
      },
      {
        question: "What is the profit factor formula?",
        answer:
          "The common formula is profit factor = gross profit / absolute gross loss.",
      },
      {
        question: "What is a good profit factor?",
        answer:
          "A profit factor above 1.0 is historically positive, but it should be reviewed with sample size, drawdown, risk, and consistency.",
      },
      {
        question: "Can profit factor be misleading?",
        answer:
          "Yes. Profit factor can be misleading when it is based on very few trades, one large outlier, or a period with no meaningful losses.",
      },
      {
        question: "Is profit factor better than win rate?",
        answer:
          "Profit factor shows whether wins were large enough compared with losses, while win rate only shows how often trades won. Both should be reviewed together.",
      },
      {
        question: "Does high profit factor guarantee future returns?",
        answer:
          "No. High historical profit factor does not guarantee future returns. Market conditions, risk behaviour, and execution can all change.",
      },
    ],
  },
  {
    view: "seo-risk-reward-ratio-trading",
    title: "Risk/Reward Ratio in Trading",
    eyebrow: "Trading Metrics",
    description:
      "Risk/reward ratio in trading explained: planned risk, potential reward, realised average win/loss, win rate, expectancy, and how Turtle Analytics reviews risk/reward.",
    keywords:
      "risk reward ratio trading, risk/reward trading, trading risk reward ratio, reward risk ratio, win rate risk reward, trading expectancy",
    intro:
      "Risk/reward ratio compares how much a trader is risking with how much they are trying to make. It is one of the most practical trading metrics because it shows why win rate alone is never enough.",
    sections: [
      {
        title: "What risk/reward ratio means",
        body:
          "Risk/reward ratio compares planned downside with planned upside. If a trader risks $100 to target $200, the planned reward is twice the planned risk, often described as 2:1.",
      },
      {
        title: "Risk/reward formula",
        body:
          "A common formula is: risk/reward = potential reward / amount risked. The same idea can also be reviewed after trades close by comparing average winning trade size with average losing trade size.",
      },
      {
        title: "Planned ratio vs realised ratio",
        body:
          "Planned risk/reward uses the stop-loss, entry, and take-profit idea before the trade. Realised risk/reward uses what actually happened after trades closed. Both are useful, but realised average win/loss behaviour is often more reliable than what a trader intended.",
      },
      {
        title: "Why win rate and risk/reward belong together",
        body:
          "A trader with a 40% win rate can still be profitable if average wins are much larger than average losses. A trader with an 80% win rate can still lose money if losses are very large. Risk/reward explains the trade-off.",
      },
      {
        title: "Risk/reward and expectancy",
        body:
          "Expectancy combines win rate and average win/loss size into one average expected outcome. Risk/reward is one of the main inputs that makes expectancy positive or negative over a series of trades.",
      },
      {
        title: "Average win/loss ratio",
        body:
          "When stop-loss and take-profit data is incomplete, platforms can still review realised payoff quality by comparing average winner size with average loser size. This is often displayed as an average win/loss or payoff ratio.",
      },
      {
        title: "Risk/reward and discipline",
        body:
          "A good planned ratio only matters if trades are executed consistently. Moving stops, closing winners early, adding to losers, or oversizing positions can make the realised ratio weaker than the planned setup.",
      },
      {
        title: "How Turtle Analytics reviews risk/reward",
        body:
          "Turtle Analytics reviews risk/reward alongside expectancy, profit factor, drawdown, average win, average loss, risk per trade, holding time, and journal notes. Where full plan data is unavailable, realised average win/loss behaviour helps show the actual payoff profile.",
      },
      {
        title: "Limitations of risk/reward",
        body:
          "Risk/reward does not guarantee profitability. It must be read with win rate, execution quality, sample size, slippage, market conditions, and whether trades followed the original plan.",
      },
    ],
    faqs: [
      {
        question: "What is risk/reward ratio in trading?",
        answer:
          "Risk/reward ratio compares the amount a trader risks with the amount they are trying to make on a trade.",
      },
      {
        question: "How do you calculate risk/reward ratio?",
        answer:
          "A common calculation is potential reward divided by amount risked. For closed trades, traders can also review average win size divided by average loss size.",
      },
      {
        question: "Is 2:1 risk/reward always good?",
        answer:
          "No. A 2:1 setup still depends on win rate, execution quality, costs, slippage, and whether the trader follows the plan.",
      },
      {
        question: "Can a low risk/reward strategy be profitable?",
        answer:
          "Yes. A lower risk/reward strategy can be profitable if the win rate is high enough and losses are controlled.",
      },
      {
        question: "Is risk/reward the same as profit factor?",
        answer:
          "No. Risk/reward compares risk and reward per trade or average trade. Profit factor compares total gross profit with total gross loss.",
      },
      {
        question: "Does risk/reward guarantee returns?",
        answer:
          "No. Risk/reward is a planning and review metric. It does not guarantee future returns or remove market risk.",
      },
    ],
  },
  {
    view: "seo-trader-verification-guide",
    title: "Trader Verification Guide",
    eyebrow: "Trader Verification",
    description:
      "Trader verification guide explaining verified trading records, data sources, screenshots, public summaries, private raw data, risk metrics, and Green Turtle Trades methodology.",
    keywords:
      "trader verification guide, verify trader performance, verified trading records, trader performance verification, verified traders, Green Turtle Trades methodology",
    intro:
      "Trader verification should make performance harder to misunderstand. A strong verification workflow explains where the data came from, which metrics were calculated, what is public, what stays private, and what the limits of the record are.",
    sections: [
      {
        title: "Why trader verification matters",
        body:
          "Trading performance is easy to exaggerate when it is shown through screenshots, edited spreadsheets, or isolated wins. Verification creates a more structured record so traders, evaluators, and investors can review performance with clearer evidence.",
      },
      {
        title: "Screenshots are not enough",
        body:
          "Screenshots can be cropped, selective, or missing context. A useful verification process should rely on platform-recorded activity, connected account data, imported history, or in-house execution records where possible.",
      },
      {
        title: "What verified can mean",
        body:
          "Verified does not mean risk-free. It means a trading record is supported by a stated data source. That source might be platform-recorded competition executions, connected broker history, MetaTrader history, uploaded records, or journal data depending on the product area.",
      },
      {
        title: "Data source labels",
        body:
          "Public pages should label whether data is live platform data, imported broker history, MetaTrader-connected history, journal records, or competition execution data. Clear labels reduce confusion and help users understand the strength of the evidence.",
      },
      {
        title: "Private raw data vs public summaries",
        body:
          "Raw trades, account details, and private journal notes should not automatically be public. Public profiles can show controlled summaries such as return, win rate, profit factor, expectancy, drawdown, risk labels, and trade count while keeping sensitive records private.",
      },
      {
        title: "Metrics that matter",
        body:
          "Useful verification metrics include realised return, unrealised return, total return, win rate, expectancy, profit factor, drawdown, risk per trade, average hold time, sample size, exposure, and consistency.",
      },
      {
        title: "Handling duplicate or weak data",
        body:
          "Verification should be strict about duplicate trades, missing identifiers, stale marks, incomplete exits, and mismatched account totals. The same account should use one central calculation source so public pages, app screens, and admin screens do not drift apart.",
      },
      {
        title: "How Green Turtle Trades approaches verification",
        body:
          "Green Turtle Trades separates raw records from public summaries, uses central metric logic where possible, and explains calculation rules in the trader verification methodology. The aim is clear evidence, not unsupported performance claims.",
      },
      {
        title: "Limits of verification",
        body:
          "Verification does not guarantee future performance, remove trading risk, or mean a trader is suitable for every investor. Public analytics and rankings are informational and should not be treated as financial advice.",
      },
    ],
    faqs: [
      {
        question: "What is trader verification?",
        answer:
          "Trader verification is the process of supporting a trading record with clear data sources, calculation rules, and controlled performance summaries.",
      },
      {
        question: "Why are screenshots not enough to verify a trader?",
        answer:
          "Screenshots can be selective or missing context. Verification is stronger when it uses platform-recorded activity, connected account data, or imported account history.",
      },
      {
        question: "Does verified mean a trader is safe?",
        answer:
          "No. Verified means the record is supported by stated data. It does not mean the trader is risk-free or guaranteed to perform in the future.",
      },
      {
        question: "Do verified traders need to publish raw trades?",
        answer:
          "Not necessarily. Public profiles can show controlled summary metrics while raw trades, account details, and private journal notes remain private.",
      },
      {
        question: "Which metrics matter for trader verification?",
        answer:
          "Important metrics include realised and unrealised return, win rate, expectancy, profit factor, drawdown, risk per trade, average hold time, trade count, sample size, exposure, and consistency.",
      },
      {
        question: "Where can I read the Green Turtle Trades methodology?",
        answer:
          "The public methodology is available at https://greenturtletraders.co.uk/methodology.",
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
      "Investment competition information for Green Turtle Trades. The canonical public hub is the University Investment Competition leaderboard.",
    keywords:
      "investment competition, investing competition, trading competition, university investment competition, student investment competition, virtual investment competition, Green Turtle Trades competition",
    intro:
      "The canonical Green Turtle Trades competition hub is the University Investment Competition page. The competition gives students a practical way to learn markets without risking personal capital, with transparent leaderboards powered by in-house execution data.",
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
      "Student investing competition information for Green Turtle Trades. The canonical public hub is the University Investment Competition leaderboard.",
    keywords:
      "student investing competition, student investment competition, university investing competition, Scottish student trading competition, student trading challenge, university finance competition",
    intro:
      "The canonical Green Turtle Trades student competition hub is the University Investment Competition page. The competition gives university competitors a risk-free environment to trade, track performance, and learn how discipline affects results.",
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
      "Virtual trading competition information for Green Turtle Trades. The canonical public hub is the University Investment Competition leaderboard.",
    keywords:
      "virtual trading competition, virtual investing competition, demo trading competition, paper trading competition, student virtual trading, risk free trading competition",
    intro:
      "The canonical Green Turtle Trades virtual competition hub is the University Investment Competition page. The competition uses virtual capital, transparent scoring, and public ranking data to make student investing more practical and measurable.",
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
