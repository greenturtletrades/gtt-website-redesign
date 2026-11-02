import terms from "../../fee-terms.json";

export type TraderFeeScenario = {
  allocation: number;
  annualReturnPercent: number;
  hurdlePercent: number;
  lossRecoveryPercent: number;
  platformCapital?: number;
};

// A constant-allocation, single-year illustration, not client billing or a payout schedule.
export function calculateTraderFeeShare(scenario: TraderFeeScenario) {
  const { allocation, annualReturnPercent, hurdlePercent, lossRecoveryPercent } = scenario;
  const platformCapital = scenario.platformCapital ?? allocation;
  if (![allocation, annualReturnPercent, hurdlePercent, lossRecoveryPercent, platformCapital].every(Number.isFinite) || allocation < 0 || platformCapital < 0 ||
      annualReturnPercent < -100 || hurdlePercent < 0 || lossRecoveryPercent < 0) {
    throw new RangeError("Enter finite scenario values with non-negative capital, hurdle and loss recovery.");
  }
  if (allocation > platformCapital) throw new RangeError("The strategy allocation cannot exceed total platform capital.");

  const grossGain = allocation * annualReturnPercent / 100;
  // The capital-based management fee is independent of performance-fee eligibility.
  const managementFee = platformCapital * terms.managementFeePercent / 100;
  const feeThresholdPercent = Math.max(hurdlePercent, lossRecoveryPercent);
  let lowerBandPercent = 0;
  const bands = terms.performanceBands.map(band => {
    const lower = Math.max(lowerBandPercent, feeThresholdPercent);
    const upper = Math.min(annualReturnPercent, band.ceilingPercent ?? Infinity);
    const eligibleReturnPercent = Math.max(0, Number((upper - lower).toFixed(10)));
    const eligibleGain = allocation * eligibleReturnPercent / 100;
    const clientFee = eligibleGain * band.clientFeePercent / 100;
    const traderShare = clientFee * band.traderSharePercent / 100;
    lowerBandPercent = band.ceilingPercent ?? Infinity;
    return { ...band, eligibleGain, clientFee, traderShare };
  });

  const clientPerformanceFee = bands.reduce((total, band) => total + band.clientFee, 0);
  const gainAfterFees = grossGain - managementFee - clientPerformanceFee;
  return {
    grossGain,
    managementFee,
    platformCapital,
    feeThresholdPercent,
    bands,
    eligibleGain: bands.reduce((total, band) => total + band.eligibleGain, 0),
    clientPerformanceFee,
    gainAfterFees,
    clientReturnAfterFeesPercent: platformCapital > 0 ? gainAfterFees / platformCapital * 100 : 0,
    traderShare: bands.reduce((total, band) => total + band.traderShare, 0),
  };
}
