import { ChevronDown, ExternalLink, LogOut, Menu, X, Brain, Trophy, TrendingUp, Landmark, type LucideIcon } from "lucide-react";
import { UserType, ViewType } from "../../App";
import logoFull from "figma:asset/8db911c3a67b2195489de29cf1364c8b6b381bc4.png";
import { useState, useEffect } from "react";
import { isInvestorPageLive } from "../../featureFlags";

interface HeaderProps {
  userType: UserType;
  onTraderClick: () => void;
  onLogout: () => void;
  onNavigate: (view: ViewType) => void;
  currentView: ViewType;
  turtleAnalyticsAuthed: boolean;
}

// For Traders and For Investors come first so they also lead the mobile menu.
const navLinks: { label: string; view: ViewType; icon: LucideIcon; activeViews: ViewType[] }[] = [
  { label: "For Traders", view: "traders", icon: TrendingUp, activeViews: ["traders", "trader-apply"] },
  ...(isInvestorPageLive
    ? [{ label: "For Investors", view: "professional-investors" as ViewType, icon: Landmark, activeViews: ["professional-investors", "investor-enquire"] as ViewType[] }]
    : []),
  { label: "Analytics", view: "turtle-analytics", icon: Brain, activeViews: ["turtle-analytics"] },
  { label: "Competition", view: "turtle-traders", icon: Trophy, activeViews: ["turtle-traders"] },
];

const competitionAppUrl =
  (import.meta.env.VITE_COMPETITION_APP_URL as string | undefined) || "https://comp.turtletrades.co.uk";

export function Header({ userType, onTraderClick, onLogout, onNavigate, currentView }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
        setMobileMenuOpen(false); // Close mobile menu when hiding
        setLoginMenuOpen(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleNavigation = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
    setLoginMenuOpen(false);
  };

  const openCompetitionApp = () => {
    window.location.href = competitionAppUrl;
  };

  return (
    <header className={`w-full bg-white border-b border-slate-200 fixed top-0 z-50 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex items-center justify-between gap-4">
        <button 
          onClick={() => handleNavigation(() => onNavigate("landing"))}
          className="flex flex-shrink-0 items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src={logoFull} alt="Green Turtle Trades" className="h-12 md:h-12 lg:h-16" />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-3 text-sm lg:text-base">
          {navLinks.map(({ label, view, icon: Icon, activeViews }) => (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              aria-current={activeViews.includes(currentView) ? "page" : undefined}
              className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-lg transition-colors ${
                activeViews.includes(currentView)
                  ? "bg-teal-100 text-teal-700"
                  : "text-slate-600 hover:text-teal-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
          {!userType ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setLoginMenuOpen((open) => !open)}
                aria-expanded={loginMenuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 bg-teal-600 text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Login
                <ChevronDown className={`h-4 w-4 transition-transform ${loginMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {loginMenuOpen ? (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 text-left shadow-2xl">
                  <button
                    type="button"
                    onClick={() => handleNavigation(onTraderClick)}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-teal-50"
                  >
                    <Brain className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-700" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">Trading Journal</span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">Log in to Turtle Analytics and trader tools.</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={openCompetitionApp}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-teal-50"
                  >
                    <Trophy className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-700" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                        University Competition
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">Open the competition app.</span>
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors px-2 lg:px-4 py-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-50 hover:text-teal-600"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="absolute right-4 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white shadow-2xl md:hidden">
          <nav className="space-y-1 p-3">
            {navLinks.map(({ label, view, icon: Icon, activeViews }) => (
              <button
                key={view}
                onClick={() => handleNavigation(() => onNavigate(view))}
                aria-current={activeViews.includes(currentView) ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeViews.includes(currentView)
                    ? "bg-teal-100 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
            {!userType ? (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div className="px-2 pb-2 text-xs font-semibold uppercase text-slate-500">Login</div>
                <button
                  onClick={() => handleNavigation(onTraderClick)}
                  className="flex w-full items-center gap-3 rounded-lg bg-white px-4 py-3 text-left text-slate-700 transition-colors hover:bg-teal-50"
                >
                  <Brain className="h-5 w-5 text-teal-700" />
                  Trading Journal
                </button>
                <button
                  onClick={() => handleNavigation(openCompetitionApp)}
                  className="mt-1 flex w-full items-center gap-3 rounded-lg bg-white px-4 py-3 text-left text-slate-700 transition-colors hover:bg-teal-50"
                >
                  <Trophy className="h-5 w-5 text-teal-700" />
                  <span className="flex-1">University Competition</span>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavigation(onLogout)}
                className="w-full flex items-center gap-3 text-left text-slate-600 hover:text-red-600 transition-colors px-4 py-3 rounded-lg hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
