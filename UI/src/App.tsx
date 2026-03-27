import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";
import { AdminLoginModal } from "./components/AdminLoginModal";
import { TurtleAnalytics } from "./components/TurtleAnalytics";
import { TurtleAnalyticsWelcome } from "./components/TurtleAnalyticsWelcome";
import { EACodePage } from "./components/EACodePage";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { PaymentModal } from "./components/PaymentModal";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { SettingsPage } from "./components/SettingsPage";
import { TermsOfService } from "./components/TermsOfService";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { RiskDisclosure } from "./components/RiskDisclosure";
import { ContactPage } from "./components/ContactPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { TraderApplicationForm } from "./components/onboarding/TraderApplicationForm";
import { TraderApplicationStatus } from "./components/onboarding/TraderApplicationStatus";
import { me } from "./api/auth";
import { submitChurnFeedback } from "./api/subscription";
import { type TraderApplicationStatus as ApplicationStatus } from "./api/traderApplication";

export type UserType = "trader" | "admin" | null;
export type ViewType =
  | "landing"
  | "turtle-analytics"
  | "ea-code"
  | "settings"
  | "terms"
  | "privacy"
  | "risk-disclosure"
  | "contact"
  | "admin-dashboard"
  | "trader-application"
  | "trader-application-status";

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname === "/admin");
  const [currentView, setCurrentView] = useState<ViewType>("landing");
  const [userType, setUserType] = useState<UserType>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [turtleAnalyticsAuthed, setTurtleAnalyticsAuthed] = useState(false);
  const [pendingUserName, setPendingUserName] = useState<string>("");
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<"payg" | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "paused">("active");
  const [onboardingStage, setOnboardingStage] = useState<"none" | "welcome" | "ea-setup" | "complete">("none");
  const [applicationEmail, setApplicationEmail] = useState("");
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [applicationRejectionReason, setApplicationRejectionReason] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // Set viewport meta tag to enable desktop layout on mobile
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=1280, user-scalable=yes, initial-scale=1.0');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=1280, user-scalable=yes, initial-scale=1.0';
      document.head.appendChild(meta);
    }
  }, []);

  // Scroll to top whenever the view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    const token = localStorage.getItem("gtt_token");
    if (!token) return;

    let cancelled = false;

    const validateSession = async () => {
      try {
        const session = await me();
        if (cancelled) return;
        if (session.ok && session.user.role === "TRADER") {
          const fullName = `${session.user.profile?.firstName || ""} ${session.user.profile?.lastName || ""}`.trim();
          setCurrentUserName(fullName || pendingUserName || session.user.email.split("@")[0]);
          setCurrentUserEmail(session.user.email);
          setUserType("trader");
          setTurtleAnalyticsAuthed(true);
        } else if (session.ok && session.user.role === "ADMIN" && session.user.status === "ACTIVE") {
          setUserType("admin");
          setTurtleAnalyticsAuthed(false);
        } else {
          setUserType(null);
          setTurtleAnalyticsAuthed(false);
        }
      } catch {
        if (cancelled) return;
        localStorage.removeItem("gtt_token");
        setUserType(null);
        setTurtleAnalyticsAuthed(false);
        setCurrentUserName("");
        setCurrentUserEmail("");
      }
    };

    validateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const adminRoute = window.location.pathname === "/admin";
      setIsAdminRoute(adminRoute);
      if (!adminRoute) {
        setShowAdminLoginModal(false);
        if (currentView === "admin-dashboard") {
          setCurrentView("landing");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentView]);

  useEffect(() => {
    if (!isAdminRoute) return;

    if (userType === "admin") {
      setCurrentView("admin-dashboard");
      setShowAdminLoginModal(false);
    } else {
      setShowAdminLoginModal(true);
    }
  }, [isAdminRoute, userType]);

  // Listen for navigation events from Turtle Analytics feature section
  useEffect(() => {
    const handleNavigateToTurtleAnalytics = () => {
      setCurrentView("turtle-analytics");
    };

    window.addEventListener('navigateToTurtleAnalytics', handleNavigateToTurtleAnalytics);
    return () => window.removeEventListener('navigateToTurtleAnalytics', handleNavigateToTurtleAnalytics);
  }, []);

  const handleTraderClick = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };

  const handleTraderSignUp = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  const handleAuthComplete = (type: "trader", details?: { name?: string; email?: string }) => {
    setShowAuthModal(false);
    
    // If trader is signing up (not logging in), show subscription modal
    if (authMode === "signup") {
      setPendingUserName(details?.name?.trim() || "Trader");
      setCurrentUserName(details?.name?.trim() || "Trader");
      setCurrentUserEmail(details?.email?.trim() || "");
      setShowSubscriptionModal(true);
      // Don't set userType or navigate yet - wait for subscription
    } else {
      // Login flow - go directly to dashboard
      // In real app, fetch user's subscription plan from backend
      // For demo, default to PAYG for returning users
      setSelectedSubscriptionPlan("payg"); // In real app: fetch from API
      setCurrentUserName(details?.name?.trim() || currentUserName);
      setCurrentUserEmail(details?.email?.trim() || currentUserEmail);
      setUserType("trader");
      setTurtleAnalyticsAuthed(true);
      setCurrentView("turtle-analytics");
    }
  };

  const handleSubscriptionComplete = (plan: "payg") => {
    setSelectedSubscriptionPlan(plan);
    setShowSubscriptionModal(false);
    
    // Show payment modal to collect card details
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    
    // Start onboarding flow with welcome screen
    setOnboardingStage("welcome");
    setUserType("trader");
    setTurtleAnalyticsAuthed(true);
    
    // In a real app, you would:
    // 1. Send card details to Stripe/payment processor
    // 2. Create subscription with selected plan
    // 3. Wait for payment confirmation webhook
    // 4. Create user account in backend
    // 5. Send confirmation email
    // 6. Then grant access to Turtle Analytics
  };

  const handlePaymentBack = () => {
    // Go back to subscription plan selection
    setShowPaymentModal(false);
    setShowSubscriptionModal(true);
    // Keep the pendingUserName so user doesn't lose their info
  };

  const handleLogout = () => {
    localStorage.removeItem("gtt_token");
    setUserType(null);
    setTurtleAnalyticsAuthed(false);
    setCurrentUserName("");
    setCurrentUserEmail("");
    if (isAdminRoute) {
      window.history.pushState({}, "", "/");
      setIsAdminRoute(false);
    }
    setCurrentView("landing");
  };

  const handleNavigate = (view: ViewType) => {
    if (view === "turtle-analytics") {
      // Allow anyone to view the analytics page (preview for non-authenticated users)
      setCurrentView("turtle-analytics");
      // Scroll to top immediately when navigating
      setTimeout(() => window.scrollTo(0, 0), 0);
    } else {
      setCurrentView(view);
      // Scroll to top immediately when navigating
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  };

  const handleOpenApplication = () => {
    setCurrentView("trader-application");
  };

  const handleApplicationSubmitted = (
    email: string,
    status: ApplicationStatus,
  ) => {
    setApplicationEmail(email);
    setApplicationStatus(status);
    setApplicationRejectionReason(null);
    setCurrentView("landing");
  };

  const handleWelcomeComplete = () => {
    // Move to EA setup stage
    setOnboardingStage("ea-setup");
    setCurrentView("ea-code");
  };

  const handleEASetupComplete = () => {
    // Complete onboarding and go to dashboard
    setOnboardingStage("complete");
    setCurrentView("turtle-analytics");
  };

  const handleEASetupSkip = () => {
    // Skip EA setup and go directly to dashboard
    setOnboardingStage("complete");
    setCurrentView("turtle-analytics");
  };

  const handleOpenSettings = () => {
    setCurrentView("settings");
  };

  const handlePauseSubscription = () => {
    // In real app: Make API call to pause subscription
    setSubscriptionStatus("paused");
    alert("✅ Subscription paused!\n\nYour subscription and ML analysis will pause from the next billing cycle (January 27, 2025). You can resume anytime.");
    // Stay on settings page to see the change
  };

  const handleResumeSubscription = () => {
    // In real app: Make API call to resume subscription
    setSubscriptionStatus("active");
    alert("✅ Welcome back!\n\nYour subscription has been resumed. ML analysis will restart immediately!");
    // Stay on settings page to see the change
  };

  const handleCancelSubscription = async (reason: string, feedback: string) => {
    try {
      await submitChurnFeedback(reason, feedback, selectedSubscriptionPlan);
      alert("✅ Subscription cancelled.\n\nWe're sorry to see you go. You'll have access until the end of your billing period.\n\nThank you for your feedback!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to store cancellation feedback.";
      alert(`Unable to cancel subscription right now.\n\n${message}`);
    }
  };

  const handleNavigateLegal = (page: "terms" | "privacy" | "risk-disclosure") => {
    setCurrentView(page);
  };

  const handleAdminClick = () => {
    window.history.pushState({}, "", "/admin");
    setIsAdminRoute(true);
    setShowAdminLoginModal(true);
  };

  const handleAdminLoginSuccess = () => {
    setShowAdminLoginModal(false);
    setUserType("admin");
    if (!isAdminRoute) {
      window.history.pushState({}, "", "/admin");
      setIsAdminRoute(true);
    }
    setCurrentView("admin-dashboard");
  };

  return (
    <div className="min-h-screen bg-white">
      {!isAdminRoute && (
        <Header 
          userType={userType}
          onTraderClick={handleTraderClick}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          currentView={currentView}
          turtleAnalyticsAuthed={turtleAnalyticsAuthed}
        />
      )}
      
      {!isAdminRoute && currentView === "landing" && (
        <LandingPage 
          onTraderClick={handleTraderClick}
          onApplyClick={handleOpenApplication}
          onNavigateLegal={handleNavigateLegal}
        />
      )}
      
      {!isAdminRoute && currentView === "turtle-analytics" && (
        userType === "trader" ? (
          <TurtleAnalytics 
            userType={userType} 
            subscriptionTier={selectedSubscriptionPlan || "payg"}
            onSignUp={handleTraderClick} 
            onLogout={handleLogout}
            onSettings={handleOpenSettings}
          />
        ) : (
          <TurtleAnalyticsWelcome onSignUp={handleTraderSignUp} onSignIn={handleTraderClick} />
        )
      )}

      {!isAdminRoute && currentView === "ea-code" && (
        <EACodePage 
          isOnboarding={onboardingStage === "ea-setup"}
          onComplete={handleEASetupComplete}
          onSkip={handleEASetupSkip}
        />
      )}

      {!isAdminRoute && currentView === "settings" && selectedSubscriptionPlan && (
        <SettingsPage
          userName={currentUserName || pendingUserName || "Trader"}
          userEmail={currentUserEmail}
          currentPlan={selectedSubscriptionPlan}
          subscriptionStatus={subscriptionStatus}
          onCancelSubscription={handleCancelSubscription}
          onPauseSubscription={handlePauseSubscription}
          onResumeSubscription={handleResumeSubscription}
        />
      )}

      {/* Legal Pages */}
      {!isAdminRoute && currentView === "terms" && (
        <TermsOfService onBack={() => setCurrentView("landing")} />
      )}

      {!isAdminRoute && currentView === "privacy" && (
        <PrivacyPolicy onBack={() => setCurrentView("landing")} />
      )}

      {!isAdminRoute && currentView === "risk-disclosure" && (
        <RiskDisclosure onBack={() => setCurrentView("landing")} />
      )}

      {!isAdminRoute && currentView === "contact" && (
        <ContactPage onBack={() => setCurrentView("landing")} />
      )}

      {!isAdminRoute && currentView === "trader-application" && (
        <TraderApplicationForm
          onBack={() => setCurrentView("landing")}
          onSubmitted={handleApplicationSubmitted}
        />
      )}

      {!isAdminRoute && currentView === "trader-application-status" && (
        <TraderApplicationStatus
          initialEmail={applicationEmail}
          initialStatus={applicationStatus}
          initialRejectionReason={applicationRejectionReason}
          onBack={() => setCurrentView("landing")}
          onStartNew={() => setCurrentView("trader-application")}
        />
      )}

      {/* Onboarding Welcome Screen */}
      {!isAdminRoute && onboardingStage === "welcome" && selectedSubscriptionPlan && (
        <WelcomeScreen
          userName={pendingUserName}
          selectedPlan={selectedSubscriptionPlan}
          onContinue={handleWelcomeComplete}
        />
      )}

      {showAuthModal && (
        <AuthModal 
          type="trader"
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onComplete={handleAuthComplete}
        />
      )}

      {showAdminLoginModal && (
        <AdminLoginModal
          onClose={() => {
            setShowAdminLoginModal(false);
            if (isAdminRoute) {
              window.history.pushState({}, "", "/");
              setIsAdminRoute(false);
              setCurrentView("landing");
            }
          }}
          onSuccess={handleAdminLoginSuccess}
        />
      )}

      {!isAdminRoute && showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          userName={pendingUserName}
          onSelectPlan={handleSubscriptionComplete}
        />
      )}

      {!isAdminRoute && showPaymentModal && selectedSubscriptionPlan && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onComplete={handlePaymentComplete}
          onBack={handlePaymentBack}
          selectedPlan={selectedSubscriptionPlan}
          userName={pendingUserName}
        />
      )}

      {isAdminRoute && currentView === "admin-dashboard" && (
        <AdminDashboard onLogout={handleLogout} />
      )}

      {isAdminRoute && currentView !== "admin-dashboard" && (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
          <div className="text-center text-white max-w-lg">
            <p className="text-teal-300 text-sm tracking-[0.25em] uppercase mb-4">Admin Portal</p>
            <h1 className="text-4xl md:text-5xl mb-4">Green Turtle Trades</h1>
            <p className="text-slate-300 text-base md:text-lg">
              Secure access for authorised administrators.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
