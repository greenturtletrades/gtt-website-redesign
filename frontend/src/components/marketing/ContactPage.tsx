import { ArrowLeft, Mail, MessageSquare, Phone, Clock, MapPin, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { submitContact } from "../../api/contact";

interface ContactPageProps {
  onBack: () => void;
}

export function ContactPage({ onBack }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitStatus === "loading") {
      return;
    }
    setSubmitStatus("loading");
    setSubmitError(null);
    try {
      await submitContact({
        name: formData.name.trim() || undefined,
        email: formData.email,
        subject: formData.subject || undefined,
        message: formData.message,
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setSubmitStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to send message.";
      setSubmitError(message);
      setSubmitStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-slate-900 text-2xl sm:text-3xl">Contact Us</h1>
              <p className="text-slate-600 text-sm">We're here to help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-slate-900 mb-4 text-lg">Get in Touch</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-slate-900 text-sm mb-1">Email Support</div>
                    <a href="mailto:contact@greenturtletraders.co.uk" className="text-teal-600 hover:text-teal-700 text-sm">
                      contact@greenturtletraders.co.uk
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-slate-900 text-sm mb-1">Business Hours</div>
                    <div className="text-slate-600 text-xs">
                      Monday - Friday: 9am - 6pm GMT<br />
                      Weekend: Limited support
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-slate-900 text-sm mb-1">Address</div>
                    <div className="text-slate-600 text-xs">
                      GREEN TURTLE TRADES LIMITED<br />
                      5 South Charlotte Street<br />
                      Edinburgh EH2 4AN<br />
                      United Kingdom
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
              <h3 className="text-teal-900 mb-3 text-sm">Need Help?</h3>
              <div className="space-y-2 text-xs text-teal-800">
                <p>Check our FAQ section</p>
                <p>View setup guides</p>
                <p>Browse documentation</p>
                <p>Average response time: &lt;24 hours</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
              <h2 className="text-slate-900 mb-2 text-xl">Send us a Message</h2>
              <p className="text-slate-600 text-sm mb-6">
                Have a question about Turtle Analytics, subscriptions, or technical support? Fill out the form below and we'll get back to you soon.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-slate-700 text-sm mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-slate-700 text-sm mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-slate-700 text-sm mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select a topic...</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing & Subscriptions</option>
                    <option value="ea-setup">EA Installation Help</option>
                    <option value="analytics">Turtle Analytics Questions</option>
                    <option value="account">Account Issues</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-slate-700 text-sm mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                    placeholder="Please describe your question or issue in detail..."
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-slate-600 text-xs">
                    <strong>Note:</strong> For account-specific issues, please include your registered email address in the message. 
                    We'll never ask for your password or payment details via email.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-8 py-3 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 text-sm"
                  disabled={submitStatus === "loading"}
                  aria-busy={submitStatus === "loading"}
                >
                  <Send className="w-4 h-4" />
                  {submitStatus === "loading" ? "Sending..." : "Send Message"}
                </button>
                {submitStatus === "success" && (
                  <div className="text-sm text-teal-700">
                    Message sent successfully. We'll respond within 24 hours.
                  </div>
                )}
                {submitStatus === "error" && (
                  <div className="text-sm text-red-600">
                    {submitError || "Unable to send message. Please try again."}
                  </div>
                )}
              </form>
            </div>

            {/* Response Time Notice */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-blue-900 text-sm mb-1">Response Time</div>
                  <p className="text-blue-800 text-xs leading-relaxed">
                    We aim to respond to all inquiries within 24 hours during business days. For urgent technical issues affecting your trading, 
                    please mark your subject as "Technical Support" for priority handling.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
