import { MapPin, Mail, Phone, Shield } from "lucide-react";
import logo from "figma:asset/6f4515e0be3e9f42f43c7a32bab7fda8514f9833.png";

interface FooterProps {
  onAdminClick?: () => void;
  onNavigateLegal?: (page: "terms" | "privacy" | "risk-disclosure" | "contact") => void;
}

export function Footer({ onAdminClick, onNavigateLegal }: FooterProps) {
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
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4" />
                <a href="tel:+442079460123" className="hover:text-teal-400 transition-colors">
                  +44 20 7946 0123
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
                  <p>Green Turtle Trades Ltd</p>
                  <p>123 Canary Wharf</p>
                  <p>London E14 5AB</p>
                </div>
              </div>
              <p>Company No: 12345678</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg mb-4">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => onNavigateLegal && onNavigateLegal("contact")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Contact Us
              </button>
              <button
                onClick={() => onNavigateLegal && onNavigateLegal("privacy")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => onNavigateLegal && onNavigateLegal("terms")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Terms of Service
              </button>
              <button
                onClick={() => onNavigateLegal && onNavigateLegal("risk-disclosure")}
                className="block text-slate-400 hover:text-teal-400 transition-colors text-left"
              >
                Risk Disclosure
              </button>
              {onAdminClick && (
                <button
                  onClick={onAdminClick}
                  className="flex items-center gap-2 text-slate-500 hover:text-teal-400 transition-colors text-xs mt-4"
                >
                  <Shield className="w-3 h-3" />
                  Admin Access
                </button>
              )}
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