import type { Option } from "./FormControls";

// ISO 3166-1 alpha-2 codes; display names come from the browser so the list stays current.
const regionCodes =
  "AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FO FR GA GB GD GE GG GH GI GL GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NZ OM PA PE PG PH PK PL PR PS PT PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TC TD TG TH TJ TL TM TN TO TR TT TW TZ UA UG US UY UZ VA VC VE VG VN VU WS XK YE ZA ZM ZW".split(" ");

function buildCountryOptions(): Option[] {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en-GB"], { type: "region" });
  } catch {
    names = null;
  }
  const options = regionCodes
    .map((code) => ({ value: code, label: names?.of(code) || code }))
    .sort((a, b) => a.label.localeCompare(b.label, "en-GB"));
  const uk = options.find((option) => option.value === "GB");
  return uk ? [uk, ...options.filter((option) => option !== uk)] : options;
}

export const countryOptions = buildCountryOptions();
