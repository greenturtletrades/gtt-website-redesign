import { useState, useEffect } from "react";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminLoginModal } from "./components/admin/AdminLoginModal";
import { AuthModal } from "./components/auth/AuthModal";
import { PlanSelectionModal, type SignupPlanChoice } from "./components/auth/PlanSelectionModal";
import { ResetPasswordModal } from "./components/auth/ResetPasswordModal";
import { SubscriptionModal } from "./components/auth/SubscriptionModal";
import { WelcomeScreen } from "./components/auth/WelcomeScreen";
import { AboutPage } from "./components/marketing/AboutPage";
import { ContactPage } from "./components/marketing/ContactPage";
import { FaqsPage } from "./components/marketing/FaqsPage";
import { Header } from "./components/marketing/Header";
import { InvestorEnquiryPage } from "./components/marketing/InvestorEnquiryPage";
import { LandingPage } from "./components/marketing/LandingPage";
import { ProfessionalInvestorsPage } from "./components/marketing/ProfessionalInvestorsPage";
import { SeoContentPage } from "./components/marketing/SeoContentPage";
import { TraderApplicationPage } from "./components/marketing/TraderApplicationPage";
import { TradersPage } from "./components/marketing/TradersPage";
import { TurtleTradersPage } from "./components/marketing/TurtleTradersPage";
import { PrivacyPolicy } from "./components/legal/PrivacyPolicy";
import { RiskDisclosure } from "./components/legal/RiskDisclosure";
import { TermsOfService } from "./components/legal/TermsOfService";
import { EACodePage } from "./components/trader/EACodePage";
import { SettingsPage } from "./components/trader/SettingsPage";
import { TurtleAnalytics } from "./components/trader/TurtleAnalytics";
import { TurtleAnalyticsWelcome } from "./components/trader/TurtleAnalyticsWelcome";
import type { AdminLoginResponse } from "./api/admin";
import { logout } from "./api/auth";
import { ApiError, clearStoredToken } from "./api/client";
import { fetchAccountState } from "./api/settings";
import { createCheckoutSession, pauseSubscription, resumeSubscription } from "./api/subscription";
import { getConfig } from "./api/config";
import { isInvestorPageLive } from "./featureFlags";
import { applySeoMetadata } from "./seo/metadata";
import { getPathForView, getRedirectPathForPath, getViewFromPath, type ViewType } from "./seo/routes";

export type UserType = "trader" | "admin" | null;
export type { ViewType } from "./seo/routes";

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname === "/admin");
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const redirectPath = getRedirectPathForPath(window.location.pathname);
    if (redirectPath) {
      window.history.replaceState({}, "", redirectPath);
      return getViewFromPath(redirectPath);
    }
    return getViewFromPath(window.location.pathname);
  });
  const [userType, setUserType] = useState<UserType>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlanSelectionModal, setShowPlanSelectionModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [turtleAnalyticsAuthed, setTurtleAnalyticsAuthed] = useState(false);
  const [pendingUserName, setPendingUserName] = useState<string>("");
  const [pendingReferralCode, setPendingReferralCode] = useState<string>("");
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<"free" | "payg" | "premium" | "internal" | null>(null);
  const [selectedSignupPlan, setSelectedSignupPlan] = useState<SignupPlanChoice>("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "paused" | "cancelling" | "not_started">("not_started");
  const [onboardingStage, setOnboardingStage] = useState<"none" | "welcome" | "ea-setup" | "complete">("none");
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentAdminIsSuperAdmin, setCurrentAdminIsSuperAdmin] = useState(false);
  const [mlEnabled, setMlEnabled] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutExhausted, setCheckoutExhausted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetRole, setResetRole] = useState<"trader" | "admin">("trader");

  const hasMlModelAccess = (status: string | undefined, billingExempt: boolean) => {
    if (billingExempt) {
      return true;
    }
    return status === "active" || status === "trialing" || status === "cancelling";
  };

  const isAccountBillingExempt = (accountState: {
    account?: {
      billingExempt?: boolean;
      billing?: {
        billingExempt?: boolean;
      } | null;
    };
  }) => Boolean(accountState.account?.billingExempt || accountState.account?.billing?.billingExempt);

  const navigateToView = (view: ViewType, options: { replace?: boolean } = {}) => {
    const path = getPathForView(view);
    if (window.location.pathname !== path) {
      if (options.replace) {
        window.history.replaceState({}, "", path);
      } else {
        window.history.pushState({}, "", path);
      }
    }
    setCurrentView(view);
  };

  useEffect(() => {
    applySeoMetadata(currentView);
  }, [currentView]);

  useEffect(() => {
    getConfig()
      .then(cfg => setMlEnabled(cfg.ml_enabled))
      .catch(() => setMlEnabled(false));
  }, []);

  // Handle password reset link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reset = params.get("reset");
    if (reset) {
      const role = params.get("resetRole") === "admin" || window.location.pathname === "/admin" ? "admin" : "trader";
      window.history.replaceState({}, "", window.location.pathname);
      setResetToken(reset);
      setResetRole(role);
    }
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
          const exempt = isAccountBillingExempt(accountState);
          if (accountState.ok && hasMlModelAccess(status, exempt)) {
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
        else {
          setCheckoutPending(false);
          setCheckoutExhausted(true);
        }
      };
      setTimeout(poll, 2000);
    } else if (checkout === "cancelled") {
      // User cancelled Stripe checkout — return them to the analytics page so the Subscribe button is visible
      navigateToView("turtle-analytics", { replace: true });
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
          setSelectedSubscriptionPlan(accountState.account.plan || "free");
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
          const isBillingExempt = isAccountBillingExempt(accountState);
          setTurtleAnalyticsAuthed(hasMlModelAccess(nextStatus, isBillingExempt));
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
        setCurrentView(getViewFromPath(window.location.pathname));
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
      navigateToView("turtle-analytics");
    };

    window.addEventListener('navigateToTurtleAnalytics', handleNavigateToTurtleAnalytics);
    return () => window.removeEventListener('navigateToTurtleAnalytics', handleNavigateToTurtleAnalytics);
  }, []);

  const handleTraderClick = () => {
    if (!isAdminRoute) {
      navigateToView("turtle-analytics");
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
    setAuthMode("login");
    setShowAuthModal(true);
  };

  const handleTraderSignUp = () => {
    setShowPlanSelectionModal(true);
  };

  const handleSignupPlanSelected = (plan: SignupPlanChoice) => {
    setSelectedSignupPlan(plan);
    setSelectedSubscriptionPlan(plan);
    setShowPlanSelectionModal(false);
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  const handleAuthComplete = async (
    type: "trader",
    details?: { name?: string; email?: string; referralCode?: string },
  ) => {
    setShowAuthModal(false);

    if (authMode === "signup") {
      setPendingUserName(details?.name?.trim() || "Trader");
      setPendingReferralCode(details?.referralCode?.trim().toUpperCase() || "");
      setCurrentUserName(details?.name?.trim() || "Trader");
      setCurrentUserEmail(details?.email?.trim() || "");
      setSelectedSubscriptionPlan(selectedSignupPlan);
      setSubscriptionStatus("not_started");
      setUserType("trader");
      setTurtleAnalyticsAuthed(false);
      navigateToView("turtle-analytics");
      if (selectedSignupPlan === "payg") {
        setShowSubscriptionModal(true);
      }
    } else {
      // Login flow — load real billing state so ML access is gated correctly.
      setCurrentUserName(details?.name?.trim() || currentUserName);
      setCurrentUserEmail(details?.email?.trim() || currentUserEmail);
      setUserType("trader");
      try {
        const accountState = await fetchAccountState();
        if (accountState.ok) {
          setSelectedSubscriptionPlan(accountState.account.plan || "free");
          const status = accountState.account.billing?.subscriptionStatus?.toLowerCase();
          const exempt = isAccountBillingExempt(accountState);
          setTurtleAnalyticsAuthed(hasMlModelAccess(status, exempt));
          if (status === "paused") {
            setSubscriptionStatus("paused");
          } else if (status === "cancelling") {
            setSubscriptionStatus("cancelling");
          } else if (status === "trialing" || status === "active") {
            setSubscriptionStatus("active");
          } else {
            setSubscriptionStatus("not_started");
          }
        } else {
          setSelectedSubscriptionPlan("free");
          setTurtleAnalyticsAuthed(false);
        }
      } catch {
        setSelectedSubscriptionPlan("free");
        setTurtleAnalyticsAuthed(false);
      }
      navigateToView("turtle-analytics");
    }
  };

  const shouldShowPaidSignupWall =
    userType === "trader" &&
    selectedSubscriptionPlan === "payg" &&
    subscriptionStatus === "not_started" &&
    !turtleAnalyticsAuthed;

  const handleSubscriptionComplete = (plan: "payg", referralCode?: string) => {
    setSelectedSubscriptionPlan(plan);
    setShowSubscriptionModal(false);

    createCheckoutSession(referralCode)
      .then((response) => {
        if (response.bypass) {
          setUserType("trader");
          setTurtleAnalyticsAuthed(true);
          navigateToView("turtle-analytics");
          setPendingReferralCode("");
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
    setPendingReferralCode("");
    if (isAdminRoute) {
      window.history.pushState({}, "", "/");
      setIsAdminRoute(false);
    }
    navigateToView("landing");
  };

  const handleAccountDeleted = () => {
    clearStoredToken();
    setUserType(null);
    setCurrentAdminIsSuperAdmin(false);
    setTurtleAnalyticsAuthed(false);
    setCurrentUserName("");
    setCurrentUserEmail("");
    setPendingUserName("");
    setPendingReferralCode("");
    setSelectedSubscriptionPlan(null);
    setSubscriptionStatus("not_started");
    setOnboardingStage("none");
    if (isAdminRoute) {
      window.history.pushState({}, "", "/");
      setIsAdminRoute(false);
    }
    navigateToView("landing");
  };

  const handleNavigate = (view: ViewType) => {
    if (view === "turtle-analytics") {
      // Allow anyone to view the analytics page (preview for non-authenticated users)
      navigateToView("turtle-analytics");
      // Scroll to top immediately when navigating
      setTimeout(() => window.scrollTo(0, 0), 0);
    } else {
      navigateToView(view);
      // Scroll to top immediately when navigating
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  };

  const handleWelcomeComplete = () => {
    // Move to EA setup stage
    setOnboardingStage("ea-setup");
    setCurrentView("ea-code");
  };

  const handleEASetupComplete = () => {
    // Complete onboarding and go to dashboard
    setOnboardingStage("complete");
    navigateToView("turtle-analytics");
  };

  const handleEASetupSkip = () => {
    // Skip EA setup and go directly to dashboard
    setOnboardingStage("complete");
    navigateToView("turtle-analytics");
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

  const handleAdminClick = () => {
    window.history.pushState({}, "", "/admin");
    setIsAdminRoute(true);
    setShowAdminLoginModal(true);
  };

  const handleAdminLoginSuccess = (adminUser?: AdminLoginResponse["user"]) => {
    setShowAdminLoginModal(false);
    setUserType("admin");
    if (adminUser) {
      setCurrentAdminIsSuperAdmin(Boolean(adminUser.isSuperAdmin));
    }
    if (!isAdminRoute) {
      window.history.pushState({}, "", "/admin");
      setIsAdminRoute(true);
    }
    setCurrentView("admin-dashboard");
  };

  // Until the investor page is signed off, its addresses fall back to the homepage.
  const isInvestorView = currentView === "professional-investors" || currentView === "investor-enquire";
  const showLanding = currentView === "landing" || (isInvestorView && !isInvestorPageLive);

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
      
      {!isAdminRoute && showLanding && (
        <LandingPage
          onNavigate={navigateToView}
          mlEnabled={mlEnabled}
        />
      )}

      {!isAdminRoute && currentView === "traders" && (
        <TradersPage onNavigate={navigateToView} />
      )}

      {!isAdminRoute && currentView === "trader-apply" && (
        <TraderApplicationPage onNavigate={navigateToView} />
      )}

      {!isAdminRoute && isInvestorPageLive && currentView === "professional-investors" && (
        <ProfessionalInvestorsPage onNavigate={navigateToView} />
      )}

      {!isAdminRoute && isInvestorPageLive && currentView === "investor-enquire" && (
        <InvestorEnquiryPage onNavigate={navigateToView} />
      )}

      {!isAdminRoute && currentView === "faqs" && (
        <FaqsPage onNavigate={navigateToView} />
      )}

      {!isAdminRoute && currentView === "about" && (
        <AboutPage onNavigate={navigateToView} />
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
        ) : userType === "trader" ? (
          shouldShowPaidSignupWall ? (
            <TurtleAnalyticsWelcome
              onSignUp={handleTraderSignUp}
              onSignIn={handleTraderClick}
              isLoggedIn={true}
              onSubscribe={() => setShowSubscriptionModal(true)}
            />
          ) : (
            <TurtleAnalytics
              userType={userType} 
              subscriptionTier={selectedSubscriptionPlan || "free"}
              subscriptionStatus={subscriptionStatus}
              mlModelAccessEnabled={turtleAnalyticsAuthed}
              onSignUp={handleTraderClick} 
              onLogout={handleLogout}
              onSettings={handleOpenSettings}
              onPauseSubscription={handlePauseSubscription}
              onResumeSubscription={handleResumeSubscription}
            />
          )
        ) : (
          <TurtleAnalyticsWelcome
            onSignUp={handleTraderSignUp}
            onSignIn={handleTraderClick}
            isLoggedIn={userType === "trader"}
            onSubscribe={() => setShowSubscriptionModal(true)}
          />
        )
      )}

      {!isAdminRoute && currentView === "turtle-traders" && (
        <TurtleTradersPage onNavigate={navigateToView} />
      )}

      {!isAdminRoute && currentView.startsWith("seo-") && (
        <SeoContentPage view={currentView} onNavigate={navigateToView} />
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

      {checkoutExhausted && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-6">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-slate-900 text-xl mb-2">Payment received</h2>
            <p className="text-slate-600 text-sm mb-6">
              Your payment was successful but your account is still being activated. This can take a minute.
              Please refresh to check — if the problem persists, contact support with your email address.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Refresh now
            </button>
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
          onAccountDeleted={handleAccountDeleted}
        />
      )}

      {/* Legal Pages */}
      {!isAdminRoute && currentView === "terms" && (
        <TermsOfService onBack={() => navigateToView("landing")} />
      )}

      {!isAdminRoute && currentView === "privacy" && (
        <PrivacyPolicy onBack={() => navigateToView("landing")} />
      )}

      {!isAdminRoute && currentView === "risk-disclosure" && (
        <RiskDisclosure onBack={() => navigateToView("landing")} />
      )}

      {!isAdminRoute && currentView === "contact" && (
        <ContactPage onBack={() => navigateToView("landing")} />
      )}

      {/* Onboarding Welcome Screen */}
      {!isAdminRoute && onboardingStage === "welcome" && selectedSubscriptionPlan === "payg" && (
        <WelcomeScreen
          userName={pendingUserName}
          selectedPlan="payg"
          onContinue={handleWelcomeComplete}
        />
      )}

      {showPlanSelectionModal && (
        <PlanSelectionModal
          onClose={() => setShowPlanSelectionModal(false)}
          onSelectPlan={handleSignupPlanSelected}
        />
      )}

      {showAuthModal && (
        <AuthModal 
          type="trader"
          initialMode={authMode}
          signupPlan={selectedSignupPlan}
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
              navigateToView("landing");
            }
          }}
          onSuccess={handleAdminLoginSuccess}
        />
      )}

      {!isAdminRoute && showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          userName={pendingUserName}
          initialReferralCode={pendingReferralCode}
          onSelectPlan={handleSubscriptionComplete}
        />
      )}

      {isAdminRoute && userType === "admin" && currentView === "admin-dashboard" && (
        <AdminDashboard
          currentAdminIsSuperAdmin={currentAdminIsSuperAdmin}
          onLogout={handleLogout}
        />
      )}

      {resetToken && (
        <ResetPasswordModal
          token={resetToken}
          onClose={() => setResetToken(null)}
          onSuccess={() => {
            setResetToken(null);
            if (resetRole === "admin") {
              window.history.replaceState({}, "", "/admin");
              setIsAdminRoute(true);
              setShowAdminLoginModal(true);
              setShowAuthModal(false);
            } else {
              setAuthMode("login");
              setShowAuthModal(true);
            }
          }}
        />
      )}

      {isAdminRoute && userType !== "admin" && (
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
