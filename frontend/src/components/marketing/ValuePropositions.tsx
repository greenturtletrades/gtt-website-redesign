import { Award, Eye, Lock } from "lucide-react";

const values = [
  { icon: Lock, title: "Security", description: "Protecting your information is a priority as we develop our platform and verification processes." },
  { icon: Eye, title: "Transparency", description: "Clear performance records, understandable risk metrics, and an honest distinction between what is available today and what we are building." },
  { icon: Award, title: "Regulation", description: "Regulation protects everyone. We are developing the investor product with regulatory requirements in mind, before real-capital access becomes available." },
];

export function ValuePropositions() {
  return <section className="home-values" aria-labelledby="home-values-title">
    <header className="home-section-heading">
      <h2 id="home-values-title">Our Values</h2>
      <p>Held by us, for you.</p>
    </header>
    <div className="home-values-grid">
      {values.map(({ icon: Icon, title, description }) => <article className="home-value" key={title}>
        <div className="home-value-icon"><Icon aria-hidden="true" /></div>
        <div><h3>{title}</h3><p>{description}</p></div>
      </article>)}
    </div>
  </section>;
}
