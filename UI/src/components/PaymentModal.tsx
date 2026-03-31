import { X, CreditCard, Lock, Check } from "lucide-react";
import { useState } from "react";

interface PaymentModalProps {
  onClose: () => void;
  onComplete: () => void;
  onBack: () => void;
  selectedPlan: "payg";
  userName?: string;
  hasReferralCode?: boolean;
}

export function PaymentModal({ onClose, onComplete, onBack, selectedPlan, userName, hasReferralCode = false }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [isProcessing, setIsProcessing] = useState(false);

  const planDetails = {
    payg: {
      name: "Pay-As-You-Go",
      price: "£10.00",
      billing: "monthly + £0.20 per trade",
      description: "Base subscription + usage fees"
    }
  };

  const plan = planDetails[selectedPlan];

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "");
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(formatCardNumber(value));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setExpiryDate(formatExpiryDate(value));
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setCvv(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In production, you would:
    // 1. Send card details to Stripe/payment processor
    // 2. Wait for payment confirmation
    // 3. Create user account in backend
    // 4. Send confirmation email
    // 5. Redirect to dashboard

    setIsProcessing(false);
    onComplete();
  };

  const isFormValid = () => {
    return (
      cardNumber.replace(/\s/g, "").length === 16 &&
      expiryDate.length === 5 &&
      cvv.length >= 3 &&
      cardName.trim() !== "" &&
      billingAddress.trim() !== "" &&
      city.trim() !== "" &&
      postcode.trim() !== ""
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onBack}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          disabled={isProcessing}
          title="Back to plan selection"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-slate-900 mb-2 text-2xl sm:text-3xl">
            Complete Your Payment
          </h2>
          <p className="text-slate-600">
            {userName && `${userName}, `}Enter your payment details to activate your subscription
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form - Left Side */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Card Information */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                Card Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-700 text-sm mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={isProcessing}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      disabled={isProcessing}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={handleCvvChange}
                      placeholder="123"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      disabled={isProcessing}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-sm mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={isProcessing}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-slate-900 mb-4">
                Billing Address
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-700 text-sm mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="123 High Street"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={isProcessing}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="London"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      disabled={isProcessing}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm mb-2">
                      Postcode
                    </label>
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                      placeholder="SW1A 1AA"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      disabled={isProcessing}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-sm mb-2">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={isProcessing}
                    required
                  >
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Spain">Spain</option>
                    <option value="Italy">Italy</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-slate-900 text-white rounded-lg p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">
                  Your payment information is encrypted and secure. We use industry-standard SSL encryption 
                  and never store your full card details on our servers.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid() || isProcessing}
              className={`w-full py-4 rounded-lg transition-all text-lg ${
                isFormValid() && !isProcessing
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-lg"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing Payment...
                </span>
              ) : (
                `Pay ${hasReferralCode ? '£8.00' : plan.price} Now`
              )}
            </button>

            <p className="text-center text-slate-500 text-xs">
              By completing this payment, you agree to our Terms of Service and Privacy Policy. 
              Your subscription will auto-renew monthly unless cancelled.
            </p>
          </form>

          {/* Order Summary - Right Side */}
          <div className="lg:col-span-1">
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 sticky top-0">
              <h3 className="text-slate-900 mb-4">
                Order Summary
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-slate-900 font-semibold mb-1">{plan.name}</div>
                  <div className="text-slate-600 text-sm">{plan.description}</div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 text-sm">Subscription</span>
                    <span className="text-slate-900">{plan.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 text-sm">Billing</span>
                    <span className="text-slate-600 text-sm">{plan.billing}</span>
                  </div>
                  {hasReferralCode && (
                    <div className="flex justify-between items-center text-xs text-teal-600 mb-3">
                      <span>Referral Discount (First 2 Months)</span>
                      <span>-£2.00</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-900 font-semibold">Due Today</span>
                    <span className="text-slate-900 font-semibold text-2xl">{hasReferralCode ? '£8.00' : plan.price}</span>
                  </div>
                  <div className="text-slate-600 text-xs">
                    {hasReferralCode 
                      ? 'Your subscription will renew at £8.00 for the second month, then £10.00/month thereafter'
                      : `Your subscription will auto-renew at ${plan.price}/month`
                    }
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Cancel anytime, no questions asked</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Full access to Turtle Analytics</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Email support included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
