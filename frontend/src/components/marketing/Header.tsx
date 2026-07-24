import { LogOut, Menu, X, Home, Brain, Trophy, BookOpen } from "lucide-react";
import { UserType, ViewType } from "../../App";
import logoFull from "figma:asset/8db911c3a67b2195489de29cf1364c8b6b381bc4.png";
import { useState, useEffect } from "react";

interface HeaderProps {
  userType: UserType;
  onTraderClick: () => void;
  onLogout: () => void;
  onNavigate: (view: ViewType) => void;
  currentView: ViewType;
  turtleAnalyticsAuthed: boolean;
}

export function Header({ userType, onTraderClick, onLogout, onNavigate, currentView }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleNavigation = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
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
          {!userType ? (
            <>
              <button
                onClick={() => onNavigate("landing")}
                className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-lg transition-colors ${
                  currentView === "landing" 
                    ? "bg-teal-100 text-teal-700" 
                    : "text-slate-600 hover:text-teal-600"
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => onNavigate("about")}
                className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-lg transition-colors ${
                  currentView === "about"
                    ? "bg-teal-100 text-teal-700"
                    : "text-slate-600 hover:text-teal-600"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                About Us
              </button>
              <button
                onClick={() => onNavigate("turtle-analytics")}
                className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-lg transition-colors ${
                  currentView === "turtle-analytics" 
                    ? "bg-teal-100 text-teal-700" 
                    : "text-slate-600 hover:text-teal-600"
                }`}
              >
                <Brain className="w-4 h-4" />
                Trading Analytics
              </button>
              <button
                onClick={() => onNavigate("turtle-traders")}
                className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-lg transition-colors ${
                  currentView === "turtle-traders"
                    ? "bg-teal-100 text-teal-700"
                    : "text-slate-600 hover:text-teal-600"
                }`}
              >
                <Trophy className="w-4 h-4" />
                Uni Competition
              </button>
              <button
                onClick={onTraderClick}
                className="bg-teal-600 text-white px-4 lg:px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Login
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate("landing")}
                className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-lg transition-colors ${
                  currentView === "landing" 
                    ? "bg-teal-100 text-teal-700" 
                    : "text-slate-600 hover:text-teal-600"
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => onNavigate("about")}
                className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-lg transition-colors ${
                  currentView === "about"
                    ? "bg-teal-100 text-teal-700"
                    : "text-slate-600 hover:text-teal-600"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                About Us
              </button>
              <button
                onClick={() => onNavigate("turtle-analytics")}
                className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-lg transition-colors ${
                  currentView === "turtle-analytics" 
                    ? "bg-teal-100 text-teal-700" 
                    : "text-slate-600 hover:text-teal-600"
                }`}
              >
                <Brain className="w-4 h-4" />
                Trading Analytics
              </button>
              <button
                onClick={() => onNavigate("turtle-traders")}
                className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-lg transition-colors ${
                  currentView === "turtle-traders"
                    ? "bg-teal-100 text-teal-700"
                    : "text-slate-600 hover:text-teal-600"
                }`}
              >
                <Trophy className="w-4 h-4" />
                Uni Competition
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors px-2 lg:px-4 py-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
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
            {!userType ? (
              <>
                <button
                  onClick={() => handleNavigation(() => onNavigate("landing"))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === "landing" 
                      ? "bg-teal-100 text-teal-700" 
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
                <button
                  onClick={() => handleNavigation(() => onNavigate("about"))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === "about"
                      ? "bg-teal-100 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  About Us
                </button>
                <button
                  onClick={() => handleNavigation(() => onNavigate("turtle-analytics"))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === "turtle-analytics" 
                      ? "bg-teal-100 text-teal-700" 
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Brain className="w-5 h-5" />
                  Trading Analytics
                </button>
                <button
                  onClick={() => handleNavigation(() => onNavigate("turtle-traders"))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === "turtle-traders"
                      ? "bg-teal-100 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                  Uni Competition
                </button>
                <button
                  onClick={() => handleNavigation(onTraderClick)}
                  className="mt-2 w-full rounded-lg bg-teal-600 px-4 py-3 text-left text-white transition-colors hover:bg-teal-700"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation(() => onNavigate("landing"))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === "landing" 
                      ? "bg-teal-100 text-teal-700" 
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
                <button
                  onClick={() => handleNavigation(() => onNavigate("about"))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === "about"
                      ? "bg-teal-100 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  About Us
                </button>
                <button
                  onClick={() => handleNavigation(() => onNavigate("turtle-analytics"))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === "turtle-analytics" 
                      ? "bg-teal-100 text-teal-700" 
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  Trading Analytics
                </button>
                <button
                  onClick={() => handleNavigation(() => onNavigate("turtle-traders"))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentView === "turtle-traders"
                      ? "bg-teal-100 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  Uni Competition
                </button>
                <button
                  onClick={() => handleNavigation(onLogout)}
                  className="w-full flex items-center gap-3 text-left text-slate-600 hover:text-red-600 transition-colors px-4 py-3 rounded-lg hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
