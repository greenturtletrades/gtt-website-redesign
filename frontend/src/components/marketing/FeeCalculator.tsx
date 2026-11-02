import { useId, useState } from "react";
import { Calculator, ChevronDown, RotateCcw } from "lucide-react";
import terms from "../../../fee-terms.json";
import { calculateTraderFeeShare } from "../../lib/trader-fees";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 });
const percent = (value: number) => `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value)}%`;
type Field = keyof typeof terms.illustrationDefaults;
const defaults = () => Object.fromEntries(Object.entries(terms.illustrationDefaults).map(([key, value]) => [key, String(value)])) as Record<Field, string>;
const fields: Array<{ name: Field; label: string; helper: string; min: number; max: number; step: number; unit: string }> = [
  { name: "allocation", label: "Capital allocated to your strategy", helper: "Hypothetical capital held for a full year. No allocation is promised.", min: 0, max: 5000000, step: 1, unit: "£" },
  { name: "annualReturnPercent", label: "Assumed annual trading return", helper: "After trading costs, before management and performance fees.", min: -20, max: 40, step: 0.01, unit: "%" },
  { name: "hurdlePercent", label: "Assumed annual hurdle", helper: "An editable assumption, not a live interest rate or final contractual benchmark.", min: 0, max: 20, step: 0.01, unit: "%" },
  { name: "lossRecoveryPercent", label: "Prior losses to recover", helper: "Return needed to regain the starting high-water mark, as a percentage of the allocation.", min: 0, max: 100, step: 0.01, unit: "%" },
];

export function FeeCalculator({ audience }: { audience: "trader" | "investor" }) {
  const id = useId();
  const detailed = audience === "investor";
  const [inputs, setInputs] = useState(defaults);
  const visibleFields = detailed ? fields : fields.slice(0, 2);
  const invalid = fields.filter(field => {
    const value = Number(inputs[field.name]);
    return !inputs[field.name].trim() || !Number.isFinite(value) || value < field.min || value > field.max;
  });
  const result = invalid.length ? null : calculateTraderFeeShare({
    allocation: Number(inputs.allocation),
    annualReturnPercent: Number(inputs.annualReturnPercent),
    hurdlePercent: Number(inputs.hurdlePercent),
    lossRecoveryPercent: Number(inputs.lossRecoveryPercent),
  });
  const setValue = (name: Field, value: string) => setInputs(previous => ({ ...previous, [name]: value }));
  const primaryAmount = result ? (detailed ? result.gainAfterFees : result.traderShare) : null;

  return <div className={`gtt-calculator gtt-calculator-${audience}`} aria-labelledby={`${id}-title`}>
    <div className="gtt-calculator-heading">
      <div>
        <span className="home-kicker"><Calculator size={16} aria-hidden="true" />{detailed ? "Understand the fees" : "Explore your fee share"}</span>
        <h3 id={`${id}-title`}>{detailed ? "How would fees affect an annual return?" : "What could your annual fee share look like?"}</h3>
        <p>{detailed ? "Explore an illustrative investment amount, return, hurdle and loss recovery. See the proposed fees and annual result before VAT and tax." : "Choose a hypothetical allocation and annual return to see your share of the proposed performance fees."} This is an illustration, not a forecast.</p>
      </div>
      <button type="button" className="gtt-calculator-reset" onClick={() => setInputs(defaults())}><RotateCcw size={15} aria-hidden="true" />Reset</button>
    </div>

    <div className="gtt-calculator-layout">
      <div className="gtt-calculator-inputs">
        {visibleFields.map(field => {
          const hasError = invalid.some(item => item.name === field.name);
          const label = detailed && field.name === "allocation" ? "Total capital on the platform" : field.label;
          const helper = detailed && field.name === "allocation" ? "A constant example balance for the full year. The entered return is assumed across this amount; the platform is not yet available." : field.helper;
          return <div className="gtt-calculator-field" key={field.name}>
            <label htmlFor={`${id}-${field.name}`}>{label}</label>
            <div className={`gtt-calculator-input${hasError ? " is-invalid" : ""}`}>
              {field.unit === "£" && <span aria-hidden="true">£</span>}
              <input id={`${id}-${field.name}`} type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step}
                value={inputs[field.name]} onChange={event => setValue(field.name, event.target.value)}
                aria-invalid={hasError || undefined} aria-describedby={`${id}-${field.name}-help${hasError ? ` ${id}-${field.name}-error` : ""}`} />
              {field.unit === "%" && <span aria-hidden="true">%</span>}
            </div>
            <p id={`${id}-${field.name}-help`}>{helper}</p>
            {hasError && <p id={`${id}-${field.name}-error`} className="gtt-calculator-error">Enter a value between {field.min.toLocaleString("en-GB")} and {field.max.toLocaleString("en-GB")}.</p>}
            {field.name === "allocation" && <div className="gtt-calculator-presets" aria-label="Example allocations">
              {[100000, 250000, 1000000].map(amount => <button key={amount} type="button" aria-pressed={Number(inputs.allocation) === amount} onClick={() => setValue("allocation", String(amount))}>{amount === 1000000 ? "£1m" : `£${amount / 1000}k`}</button>)}
            </div>}
            {field.name === "annualReturnPercent" && <input type="range" min={field.min} max={field.max} step={field.step} value={hasError ? 0 : Number(inputs.annualReturnPercent)}
              onChange={event => setValue("annualReturnPercent", event.target.value)} aria-label="Adjust assumed annual trading return" aria-valuetext={percent(Number(inputs.annualReturnPercent) || 0)} />}
          </div>;
        })}
      </div>

      <div className={`gtt-calculator-result${primaryAmount !== null && primaryAmount < 0 ? " is-loss" : ""}`} aria-live="polite" aria-atomic="true">
        <span className="gtt-calculator-result-label">{detailed ? "Illustrative annual gain after both fees" : "Your illustrative annual fee share"}</span>
        <output data-testid={detailed ? "annual-investor-gain" : "annual-trader-fee-share"}>{primaryAmount !== null ? currency.format(primaryAmount) : "—"}</output>
        <p>{detailed ? "Each separate charge is deducted once from the final result, before VAT and tax. Actual investment results can differ and losses are possible." : "Before VAT and tax. Your share comes only from eligible performance fees. Investor management fees are separate."}</p>
        {result ? <>
          {detailed ? <dl>
            <div><dt>Scenario gain before GTT fees</dt><dd>{currency.format(result.grossGain)}</dd></div>
            <div><dt>Management fee on total platform capital ({percent(terms.managementFeePercent)})</dt><dd>{currency.format(result.managementFee)}</dd></div>
            <div><dt>Gains eligible for performance fees</dt><dd>{currency.format(result.eligibleGain)}</dd></div>
            <div><dt>Performance fee on eligible trading gains</dt><dd>{currency.format(result.clientPerformanceFee)}</dd></div>
            <div><dt>Trader’s share of that performance fee</dt><dd>{currency.format(result.traderShare)}</dd></div>
            <div><dt>Annual return after illustrated fees</dt><dd>{percent(result.clientReturnAfterFeesPercent)}</dd></div>
          </dl> : <p className="gtt-calculator-example">Based on {currency.format(Number(inputs.allocation))} following your strategy and a {percent(Number(inputs.annualReturnPercent))} trading return for the year.</p>}
          {result.traderShare === 0 && <p className="gtt-calculator-zero">{detailed ? "No performance fee arises in this scenario. A management fee may still apply." : "This scenario generates no trader performance-fee share."}</p>}
        </> : <p className="gtt-calculator-zero">Complete the highlighted inputs to calculate a scenario.</p>}
      </div>
    </div>

    {detailed && result && <details className="gtt-calculator-breakdown">
      <summary>See the marginal fee calculation<ChevronDown size={18} aria-hidden="true" /></summary>
      <div className="gtt-table-wrap" role="region" aria-label="Illustrative performance fees by band" tabIndex={0}>
        <table className="gtt-table"><thead><tr><th scope="col">Band</th><th scope="col">Eligible gain</th><th scope="col">Client fee</th><th scope="col">Trader’s fee share</th></tr></thead>
          <tbody>{result.bands.map(band => <tr key={band.label}><th scope="row">{band.label}</th><td>{currency.format(band.eligibleGain)}</td><td>{currency.format(band.clientFee)}</td><td>{currency.format(band.traderShare)}</td></tr>)}</tbody>
        </table>
      </div>
    </details>}
    <p className="gtt-calculator-assumptions">{detailed ? `Simplified annual scenario: constant total capital, the entered return across that full amount, one common hurdle and loss-recovery threshold, no cash flows and one year-end calculation. The ${percent(terms.managementFeePercent)} management fee applies to total platform capital. Performance fees use eligible trading gains before that separate charge. Both charges are deducted once to show the final gain. VAT, tax, quarterly payments, holdbacks and later adjustments are excluded; final agreements and client records determine actual charges.` : `Assumes a full year at the selected allocation, a ${percent(terms.illustrationDefaults.hurdlePercent)} example hurdle and no prior losses to recover. The investor’s management fee is separate from this performance-fee calculation. VAT, tax and payment timing are excluded. Capital, returns and earnings are not guaranteed; final agreements and client records determine actual remuneration.`}</p>
  </div>;
}
