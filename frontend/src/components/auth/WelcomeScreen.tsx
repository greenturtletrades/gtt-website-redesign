import { Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface WelcomeScreenProps {
  userName?: string;
  selectedPlan: "payg";
  onContinue: () => void;
}

export function WelcomeScreen({ userName, selectedPlan, onContinue }: WelcomeScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 20);

    // Auto-continue after animation completes
    const timer = setTimeout(() => {
      onContinue();
    }, 1200);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onContinue]);

  const planName = "Pay-As-You-Go";

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
          </div>

          {/* Success Message */}
          <div className="mb-8">
            <h1 className="text-slate-900 mb-3 text-3xl sm:text-4xl">
              Welcome to Green Turtle Trades!
            </h1>
            <p className="text-slate-600 text-lg">
              {userName && `${userName}, `}Your payment was successful
            </p>
          </div>

          {/* Plan Details */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <span className="text-slate-900 font-semibold text-lg">{planName}</span>
            </div>
            <p className="text-slate-600 text-sm">
              Your 7-day free trial starts now
            </p>
          </div>

          {/* Setup Progress */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <span className="text-slate-700">Account created</span>
            </div>
            
            <div className="flex items-center gap-3 text-left">
              <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <span className="text-slate-700">Payment processed</span>
            </div>
            
            <div className="flex items-center gap-3 text-left">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                progress === 100 ? "bg-teal-500" : "bg-slate-200"
              }`}>
                {progress === 100 ? (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                ) : (
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <span className="text-slate-700">Setting up Turtle Analytics...</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Skip Button (Optional) */}
          <button
            onClick={onContinue}
            className="mt-6 text-slate-500 hover:text-slate-700 text-sm transition-colors"
          >
            Skip animation
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}