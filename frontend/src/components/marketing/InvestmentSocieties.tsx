import strathclyde from "../../assets/societies/686404419_18095713496125110_1450723155958880601_n.jpg";
import aberdeen from "../../assets/societies/482987102_2004962396580368_7196571756142999209_n.jpg";
import greenFeather from "../../assets/societies/422891551_760304158834705_8028578875029211763_n.jpg";
import dundee from "../../assets/societies/549237237_18015351353788052_5387897992069209369_n.jpg";
import glasgow from "../../assets/societies/549204621_18288709420284645_5443798937562249733_n.jpg";
import edinburgh from "../../assets/societies/152062836_2098519730447312_6838205939112251799_n.jpg";
import heriotWatt from "../../assets/societies/808136148_18103047920610702_1690690658954243260_n.jpg";
import "../../styles/investment-societies.css";

const societies = [
  { src: heriotWatt, name: "Heriot-Watt University Investment Society" },
  { src: aberdeen, name: "Aberdeen University Trading and Investment Club" },
  { src: glasgow, name: "Glasgow University Trading and Investment Club" },
  { src: edinburgh, name: "Edinburgh University Trading and Investment Club" },
  { src: dundee, name: "Dundee University Investment and Trading Society" },
  { src: greenFeather, name: "Participating investment society with a green feather logo" },
  { src: strathclyde, name: "Strathclyde Trading Society" },
];

export function InvestmentSocieties() {
  return (
    <section className="investment-societies" aria-label="Participating investment societies">
      <div className="investment-societies-heading">
        <h2>Participating investment societies</h2>
      </div>
      <div className="investment-societies-viewport">
        <div className="investment-societies-track">
          {[false, true].map(duplicate => (
            <ul className="investment-societies-group" key={String(duplicate)} aria-hidden={duplicate || undefined}>
              {societies.map(society => (
                <li className="investment-societies-logo" key={society.src}>
                  <img src={society.src} alt={duplicate ? "" : society.name} width={104} height={104} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
