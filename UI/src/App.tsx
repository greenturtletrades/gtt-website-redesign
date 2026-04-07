import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";
import { AdminLoginModal } from "./components/AdminLoginModal";
import { TurtleAnalytics } from "./components/TurtleAnalytics";
import { TurtleAnalyticsWelcome } from "./components/TurtleAnalyticsWelcome";
import { EACodePage } from "./components/EACodePage";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { SettingsPage } from "./components/SettingsPage";
import { TermsOfService } from "./components/TermsOfService";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { RiskDisclosure } from "./components/RiskDisclosure";
import { ContactPage } from "./components/ContactPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { TraderApplicationForm } from "./components/onboarding/TraderApplicationForm";
import { TraderApplicationStatus } from "./components/onboarding/TraderApplicationStatus";
import { logout } from "./api/auth";
import { ApiError, clearStoredToken } from "./api/client";
import { fetchAccountState } from "./api/settings";
import { createCheckoutSession, pauseSubscription, resumeSubscription } from "./api/subscription";
import { getConfig } from "./api/config";
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
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [turtleAnalyticsAuthed, setTurtleAnalyticsAuthed] = useState(false);
  const [pendingUserName, setPendingUserName] = useState<string>("");
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<"payg" | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "paused" | "cancelling" | "not_started">("not_started");
  const [onboardingStage, setOnboardingStage] = useState<"none" | "welcome" | "ea-setup" | "complete">("none");
  const [applicationEmail, setApplicationEmail] = useState("");
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [applicationRejectionReason, setApplicationRejectionReason] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentAdminIsSuperAdmin, setCurrentAdminIsSuperAdmin] = useState(false);
  const [mlEnabled, setMlEnabled] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);

  useEffect(() => {
    getConfig()
      .then(cfg => setMlEnabled(cfg.ml_enabled))
      .catch(() => setMlEnabled(false));
  }, []);

  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;

    // Clean the URL
    window.history.replaceState({}, "", window.location.pathname);

    if (checkout === "success") {
      setCheckoutPending(true);
      // Poll fetchAccountState up to 6 times with 2s gap to wait for webhook to fire
      let attempts = 0;
      const poll = async () => {
        attempts++;
        try {
          const accountState = await fetchAccountState();
          const status = accountState.account.billing?.subscriptionStatus?.toLowerCase();
          const exempt = Boolean(accountState.account.billingExempt);
          if (accountState.ok && (status === "active" || status === "trialing" || exempt)) {
            setCheckoutPending(false);
            setUserType("trader");
            setTurtleAnalyticsAuthed(true);
            setOnboardingStage("welcome");
            setSelectedSubscriptionPlan("payg");
            return;
          }
        } catch {
          // keep polling
        }
        if (attempts < 6) setTimeout(poll, 2000);
        else setCheckoutPending(false);
      };
      setTimeout(poll, 2000);
    }
  }, []);

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
    let cancelled = false;

    const validateSession = async () => {
      try {
        const accountState = await fetchAccountState();
        if (cancelled) return;
        if (accountState.ok && accountState.account.role === "TRADER") {
          const firstName = accountState.account.profile?.firstName || "";
          const lastName = accountState.account.profile?.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim();
          setCurrentUserName(fullName || pendingUserName || accountState.account.email.split("@")[0]);
          setCurrentUserEmail(accountState.account.email);
          setSelectedSubscriptionPlan(accountState.account.plan || "payg");
          const nextStatus = accountState.account.billing?.subscriptionStatus?.toLowerCase();
          if (nextStatus === "paused") {
            setSubscriptionStatus("paused");
          } else if (nextStatus === "cancelling") {
            setSubscriptionStatus("cancelling");
          } else if (nextStatus === "trialing") {
            setSubscriptionStatus("active");
          } else if (nextStatus === "active") {
            setSubscriptionStatus("active");
          } else {
            setSubscriptionStatus("not_started");
          }
          setUserType("trader");
          const hasSubscription = Boolean(nextStatus && nextStatus !== "not_started");
          const isBillingExempt = Boolean(accountState.account.billingExempt);
          setTurtleAnalyticsAuthed(hasSubscription || isBillingExempt);
        } else if (accountState.ok && accountState.account.role === "ADMIN" && accountState.account.status === "ACTIVE") {
          setUserType("admin");
          setCurrentAdminIsSuperAdmin(Boolean(accountState.account.isSuperAdmin));
          setTurtleAnalyticsAuthed(false);
        } else {
          setUserType(null);
          setCurrentAdminIsSuperAdmin(false);
          setTurtleAnalyticsAuthed(false);
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          clearStoredToken();
          setUserType(null);
          setCurrentAdminIsSuperAdmin(false);
          setTurtleAnalyticsAuthed(false);
          setCurrentUserName("");
          setCurrentUserEmail("");
        }
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
    if (!isAdminRoute) {
      setCurrentView("turtle-analytics");
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
    setAuthMode("login");
    setShowAuthModal(true);
  };

  const handleTraderSignUp = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  const handleAuthComplete = async (type: "trader", details?: { name?: string; email?: string }) => {
    setShowAuthModal(false);

    if (authMode === "signup") {
      setPendingUserName(details?.name?.trim() || "Trader");
      setCurrentUserName(details?.name?.trim() || "Trader");
      setCurrentUserEmail(details?.email?.trim() || "");
      setShowSubscriptionModal(true);
    } else {
      // Login flow — check real subscription status before granting dashboard access
      setSelectedSubscriptionPlan("payg");
      setCurrentUserName(details?.name?.trim() || currentUserName);
      setCurrentUserEmail(details?.email?.trim() || currentUserEmail);
      setUserType("trader");
      try {
        const accountState = await fetchAccountState();
        if (accountState.ok) {
          const status = accountState.account.billing?.subscriptionStatus?.toLowerCase();
          const exempt = Boolean(accountState.account.billingExempt);
          const hasSub = Boolean(status && status !== "not_started");
          setTurtleAnalyticsAuthed(hasSub || exempt);
        } else {
          setTurtleAnalyticsAuthed(false);
        }
      } catch {
        setTurtleAnalyticsAuthed(false);
      }
      setCurrentView("turtle-analytics");
    }
  };

  const handleSubscriptionComplete = (plan: "payg", referralCode?: string) => {
    setSelectedSubscriptionPlan(plan);
    setShowSubscriptionModal(false);

    createCheckoutSession(referralCode)
      .then((response) => {
        if (response.bypass) {
          setUserType("trader");
          setTurtleAnalyticsAuthed(true);
          setCurrentView("turtle-analytics");
          return;
        }
        if (response.url) {
          window.location.assign(response.url);
          return;
        }
        throw new Error("Checkout session did not return a URL.");
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Unable to start checkout.";
        alert(`Unable to start secure Stripe checkout.\n\n${message}`);
        setShowSubscriptionModal(true);
      });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Clear client state even if the backend session has already expired.
    }
    clearStoredToken();
    setUserType(null);
    setCurrentAdminIsSuperAdmin(false);
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

  const handlePauseSubscription = async () => {
    try {
      const response = await pauseSubscription();
      setSubscriptionStatus(response.subscriptionStatus === "paused" ? "paused" : "active");
      alert("Subscription paused. Future platform billing has been paused in Stripe.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to pause subscription.";
      alert(`Unable to pause subscription right now.\n\n${message}`);
    }
  };

  const handleResumeSubscription = async () => {
    try {
      const response = await resumeSubscription();
      setSubscriptionStatus(response.subscriptionStatus === "paused" ? "paused" : "active");
      alert("Subscription resumed. Platform billing is active again.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to resume subscription.";
      alert(`Unable to resume subscription right now.\n\n${message}`);
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
          mlEnabled={mlEnabled}
        />
      )}
      
      {!isAdminRoute && currentView === "turtle-analytics" && (
        !mlEnabled ? (
          <div className="min-h-screen bg-white flex items-center justify-center pt-20">
            <div className="text-center px-4">
              <h2 className="text-3xl text-slate-900 mb-4">Coming Soon</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Turtle Analytics is not yet available. Check back soon.
              </p>
            </div>
          </div>
        ) : userType === "trader" && turtleAnalyticsAuthed ? (
          <TurtleAnalytics
            userType={userType} 
            subscriptionTier={selectedSubscriptionPlan || "payg"}
            subscriptionStatus={subscriptionStatus}
            onSignUp={handleTraderClick} 
            onLogout={handleLogout}
            onSettings={handleOpenSettings}
            onPauseSubscription={handlePauseSubscription}
            onResumeSubscription={handleResumeSubscription}
          />
        ) : (
          <TurtleAnalyticsWelcome
            onSignUp={handleTraderSignUp}
            onSignIn={handleTraderClick}
            isLoggedIn={userType === "trader"}
            onSubscribe={() => setShowSubscriptionModal(true)}
          />
        )
      )}

      {checkoutPending && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-slate-900 text-xl mb-2">Setting up your account...</h2>
            <p className="text-slate-500 text-sm">This takes just a moment</p>
          </div>
        </div>
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

      {isAdminRoute && currentView === "admin-dashboard" && (
        <AdminDashboard
          currentAdminIsSuperAdmin={currentAdminIsSuperAdmin}
          onLogout={handleLogout}
        />
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
