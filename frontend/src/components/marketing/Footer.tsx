import { MapPin, Mail } from "lucide-react";
import logo from "figma:asset/6f4515e0be3e9f42f43c7a32bab7fda8514f9833.png";
import type { ViewType } from "../../seo/routes";

interface FooterProps {
  onNavigate?: (page: ViewType) => void;
}

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
            </div>
          </div>

          {/* Location & Registration */}
          <div>
            <h3 className="text-lg mb-4">Legal</h3>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>GREEN TURTLE TRADES LIMITED</p>
                  <p>5 South Charlotte Street</p>
                  <p>Edinburgh EH2 4AN</p>
                </div>
              </div>
              <p>Company No: 878660</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => onNavigate && onNavigate("turtle-analytics")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Trading Analytics
              </button>
              <button
                onClick={() => onNavigate && onNavigate("turtle-traders")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Traders Leaderboard
              </button>
              <button
                onClick={() => onNavigate && onNavigate("contact")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Contact Us
              </button>
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
