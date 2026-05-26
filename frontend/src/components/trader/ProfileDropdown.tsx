import { User, Settings, CreditCard, LogOut, Crown, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ProfileDropdownProps {
  userName: string;
  userEmail: string;
  subscriptionTier: "free" | "payg" | "premium" | "internal";
  onLogout: () => void;
  onManageSubscription?: () => void;
  onSettings?: () => void;
}

export function ProfileDropdown({ 
  userName, 
  userEmail, 
  subscriptionTier, 
  onLogout,
  onManageSubscription,
  onSettings
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tierInfo = {
    free: { name: "Free", color: "text-cyan-700", bg: "bg-cyan-100" },
    payg: { name: "Pay-as-you-go", color: "text-slate-700", bg: "bg-slate-100" },
    premium: { name: "Premium", color: "text-amber-700", bg: "bg-amber-100" },
    internal: { name: "Pay-as-you-go", color: "text-slate-700", bg: "bg-slate-100" },
  };

  const currentTier = tierInfo[subscriptionTier];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-slate-900">{userName}</div>
          <div className={`text-xs ${currentTier.color}`}>{currentTier.name}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          {/* Profile Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{userName}</div>
                <div className="text-xs text-slate-600 truncate">{userEmail}</div>
              </div>
            </div>
            <div className={`${currentTier.bg} ${currentTier.color} px-3 py-1.5 rounded-lg flex items-center justify-between text-xs`}>
              <span className="font-medium">{currentTier.name} Plan</span>
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {onSettings && (
              <button
                onClick={() => {
                  onSettings();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 text-sm text-slate-700"
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </button>
            )}

            {onManageSubscription && (
              <button
                onClick={() => {
                  onManageSubscription();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 text-sm text-slate-700"
              >
                <CreditCard className="w-4 h-4" />
                Manage Subscription
              </button>
            )}

            <div className="border-t border-slate-100 my-2"></div>

            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-sm text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
