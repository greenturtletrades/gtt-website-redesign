import { BadgeCheck, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import logo from "figma:asset/6f4515e0be3e9f42f43c7a32bab7fda8514f9833.png";
import type { ViewType } from "../../seo/routes";

interface FooterProps {
  onNavigate?: (page: ViewType) => void;
}

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.6 2c.3 2.4 1.7 4 4 4.2v3.5c-1.5 0-2.8-.4-4-1.2v6.6c0 4.2-2.7 6.9-6.7 6.9-3.5 0-6.1-2.3-6.1-5.7 0-3.7 2.9-6 6.8-5.7v3.7c-1.7-.3-3 .4-3 1.9 0 1.3 1 2.1 2.3 2.1 1.5 0 2.5-.8 2.5-3V2h4.2Z" />
    </svg>
  );
}

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.2 2.8h3.1l-6.8 7.8 8 10.6h-6.3l-4.9-6.4-5.7 6.4H2.5l7.3-8.3L2.1 2.8h6.5l4.4 5.8 5.2-5.8Zm-1.1 16.5h1.7L7.7 4.6H5.9l11.2 14.7Z" />
    </svg>
  );
}

const socialLinks = [
  {
    label: "Green Turtle Trades on LinkedIn",
    href: "https://www.linkedin.com/company/green-turtle-trade/posts/?feedView=all",
    icon: Linkedin,
  },
  {
    label: "Green Turtle Trades on Instagram",
    href: "https://www.instagram.com/greenturtletrades_/",
    icon: Instagram,
  },
  {
    label: "Green Turtle Trades on TikTok",
    href: "https://www.tiktok.com/@greenturtletrades",
    icon: TikTokIcon,
  },
  {
    label: "Green Turtle Trades on X",
    href: "https://x.com/GreenTurtleT",
    icon: XIcon,
  },
  {
    label: "Green Turtle Trades on YouTube",
    href: "https://www.youtube.com/@GreenTurtleTrades",
    icon: Youtube,
  },
];

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="w-full bg-slate-900 text-white py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <img src={logo} alt="Turtle Trades Logo" className="h-16 mb-4 rounded-lg" />
            <p className="text-slate-400 text-sm">
              Where equity meets talent
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="inline-flex items-center justify-center text-slate-400 transition-all hover:-translate-y-0.5 hover:text-teal-400"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg mb-4">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4" />
                <a href="mailto:contact@greenturtletraders.co.uk" className="hover:text-teal-400 transition-colors">
                  contact@greenturtletraders.co.uk
                </a>
              </div>
              <button
                onClick={() => onNavigate && onNavigate("contact")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Contact Us
              </button>
            </div>
          </div>

          {/* Location & Registration */}
          <div>
            <h3 className="text-lg mb-4">Legal</h3>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2">
                <BadgeCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>GREEN TURTLE TRADES LIMITED</p>
                </div>
              </div>
              <p>Company No: SC878660</p>
              <button
                onClick={() => onNavigate && onNavigate("privacy")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => onNavigate && onNavigate("terms")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Terms of Service
              </button>
              <button
                onClick={() => onNavigate && onNavigate("risk-disclosure")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Risk Disclosure
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => onNavigate && onNavigate("about")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                About Us
              </button>
              <button
                onClick={() => onNavigate && onNavigate("seo-green-turtle-trades")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                What is Green Turtle Trades?
              </button>
              <button
                onClick={() => onNavigate && onNavigate("turtle-analytics")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Trading Analytics
              </button>
              <button
                onClick={() => onNavigate && onNavigate("seo-trading-journal")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Trading Journal
              </button>
              <button
                onClick={() => onNavigate && onNavigate("seo-verified-traders")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Verified Traders
              </button>
              <button
                onClick={() => onNavigate && onNavigate("seo-trader-funding")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Trader Funding
              </button>
              <button
                onClick={() => onNavigate && onNavigate("seo-copy-trading-platform")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Copy Trading Platform
              </button>
              <button
                onClick={() => onNavigate && onNavigate("turtle-traders")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                University Competition
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Green Turtle Trades. All rights reserved.</p>
          <p className="mt-2 text-xs">
            Trading involves risk. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
