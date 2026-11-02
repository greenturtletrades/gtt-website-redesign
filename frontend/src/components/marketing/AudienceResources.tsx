import { ArrowRight } from "lucide-react";
import { NavigationLink } from "../../seo/NavigationLink";
import { getViewFromPath, type ViewType } from "../../seo/routes";
import { SectionHeading } from "./PageBlocks";

type ResourceSection = {
  kicker: string;
  title: string;
  body: string;
  links: Array<{ label: string; href: string; description: string }>;
};

export function AudienceResources({ section, id, onNavigate }: {
  section: ResourceSection;
  id: string;
  onNavigate?: (view: ViewType) => void;
}) {
  return <section className="gtt-section" aria-labelledby={id}>
    <div className="home-section-inner">
      <SectionHeading id={id} kicker={section.kicker} title={section.title} intro={section.body} />
      <div className="gtt-card-grid">
        {section.links.map(link => {
          const view = getViewFromPath(link.href);
          return <NavigationLink key={link.href} view={view} onClick={() => onNavigate?.(view)} className="gtt-card gtt-guide-card">
            <h3>{link.label}</h3>
            <p>{link.description}</p>
            <span className="gtt-card-link">Read more <ArrowRight size={16} aria-hidden="true" /></span>
          </NavigationLink>;
        })}
      </div>
    </div>
  </section>;
}
