const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

(async () => {
  const { transformWithEsbuild } = await import("vite");
  const file = path.resolve(__dirname, "../src/lib/trader-fees.ts");
  const compiled = await transformWithEsbuild(fs.readFileSync(file, "utf8"), file, { loader: "ts", format: "cjs" });
  const module = { exports: {} };
  vm.runInNewContext(compiled.code, { module, exports: module.exports, require: name => require(path.resolve(path.dirname(file), name)) });
  const calculate = module.exports.calculateTraderFeeShare;
  const base = { allocation: 250000, annualReturnPercent: 10, hurdlePercent: 3.7, lossRecoveryPercent: 0 };
  const near = (actual, expected, label) => assert(Math.abs(actual - expected) < 0.0000001, `${label}: ${actual} != ${expected}`);

  // Performance fees use trading gains before management fees:
  // £3,250 at 10% x 50%, plus £12,500 at 12.5% x 50%.
  const example = calculate(base);
  near(example.managementFee, 1875, "management fee");
  near(example.eligibleGain, 15750, "trading gains above the assumed hurdle before management fees");
  near(example.clientPerformanceFee, 1887.5, "client performance fee");
  near(example.traderShare, 943.75, "default annual trader share");
  near(example.gainAfterFees, 21237.5, "investor gain deducts each separate fee exactly once");
  near(example.clientReturnAfterFeesPercent, 8.495, "investor return after illustrated fees");
  near(calculate({ ...base, annualReturnPercent: -5 }).gainAfterFees, -14375, "negative investor outcomes include the management fee");
  assert.equal(calculate({ ...base, allocation: 0 }).clientReturnAfterFeesPercent, 0, "zero allocation does not yield a NaN return");

  for (const annualReturnPercent of [-20, 0, 3.7]) {
    assert.equal(calculate({ ...base, annualReturnPercent }).traderShare, 0, "No performance share at or below the trading-return hurdle");
  }
  near(calculate({ ...base, annualReturnPercent: 4.45 }).traderShare, 93.75, "Management fee does not reduce performance-fee eligibility");
  assert.equal(calculate({ ...base, allocation: 0 }).traderShare, 0, "No allocation means no share");
  assert.equal(calculate({ ...base, lossRecoveryPercent: 10 }).traderShare, 0, "Prior losses must first be recovered");
  near(calculate({ ...base, lossRecoveryPercent: 8 }).traderShare, 312.5, "Only the gain above the high-water mark is charged");
  near(calculate({ ...base, hurdlePercent: 12, annualReturnPercent: 20 }).traderShare, 2900, "A hurdle above the lower bands skips those bands");

  // Band boundaries remain marginal, not a new fee applied to the entire profit.
  for (const [annualReturnPercent, expected] of [[5, 162.5], [10, 943.75], [15, 2443.75], [20, 4443.75]]) {
    near(calculate({ ...base, annualReturnPercent }).traderShare, expected, "Marginal fee at " + annualReturnPercent + "%");
  }
  near(calculate({ ...base, allocation: 1000000 }).traderShare, 3775, "Capital scales the share linearly");
  const extraCapital = calculate({ ...base, platformCapital: 500000 });
  near(extraCapital.managementFee, 3750, "Management fee uses total platform capital, including capital outside this strategy");
  near(extraCapital.clientPerformanceFee, example.clientPerformanceFee, "Extra platform capital does not change this strategy’s performance fee");
  near(extraCapital.traderShare, example.traderShare, "Extra management fees do not change trader remuneration");
  near(extraCapital.gainAfterFees, 19362.5, "Separate management charge affects only the final investor result");
  near(extraCapital.clientReturnAfterFeesPercent, 3.8725, "Overall investor return uses total platform capital");
  const idleCapital = calculate({ ...base, allocation: 0, platformCapital: 250000 });
  near(idleCapital.managementFee, 1875, "Management fee remains capital-based with no strategy allocation");
  assert.equal(idleCapital.clientPerformanceFee, 0);
  assert.equal(idleCapital.traderShare, 0);
  near(idleCapital.gainAfterFees, -1875, "Idle capital has no performance fee but retains its management charge");
  for (const patch of [{ allocation: -1 }, { annualReturnPercent: NaN }, { hurdlePercent: Infinity }, { lossRecoveryPercent: -1 }, { platformCapital: -1 }]) {
    assert.throws(() => calculate({ ...base, ...patch }), /finite scenario values/);
  }
  assert.throws(() => calculate({ ...base, platformCapital: 1000 }), /cannot exceed total platform capital/);
  console.log("Fee calculator checks passed: separate capital and performance fee bases, marginal bands, hurdle, high-water mark, losses, idle capital, scaling and invalid values.");
})().catch(error => { console.error(error); process.exit(1); });
