import { useState } from "react";
import { Download, AlertCircle, FileCode, BookOpen, ArrowRight, SkipForward, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { downloadEaFile } from "../api/settings";

interface EACodePageProps {
  isOnboarding?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function EACodePage({ isOnboarding = false, onComplete, onSkip }: EACodePageProps = {}) {
  const [downloadingPlatform, setDownloadingPlatform] = useState<"MT4" | "MT5" | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadInfo, setDownloadInfo] = useState<{
    platform: "MT4" | "MT5";
    apiKeyLast4: string;
    brokerAccountId: string;
    brokerAccountNumber: string;
  } | null>(null);

  const handleDownload = async (platform: "MT4" | "MT5") => {
    setDownloadingPlatform(platform);
    setDownloadError(null);

    try {
      const response = await downloadEaFile(platform);
      const blob = new Blob([response.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.filename;
      anchor.click();
      URL.revokeObjectURL(url);

      setDownloadInfo({
        platform: response.platform,
        apiKeyLast4: response.apiKeyLast4,
        brokerAccountId: response.brokerAccountId,
        brokerAccountNumber: response.brokerAccountNumber,
      });
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Unable to generate the EA download.");
    } finally {
      setDownloadingPlatform(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="w-full bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white pt-32 sm:pt-36 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileCode className="w-8 h-8" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl">MetaTrader EA Download</h1>
            </div>
            <p className="text-teal-100 text-lg max-w-3xl">
              Generate a MetaTrader Expert Advisor file linked to your account. Each download includes a managed API key and broker account link for the current trader, and the EA only exports history when you request a model run.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="w-full bg-white py-8 px-4 sm:px-6 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-blue-900 mb-2">Installation Instructions</h3>
                <ol className="text-blue-800 text-sm space-y-2 list-decimal list-inside">
                  <li>Download the EA file for your platform below.</li>
                  <li>Open MetaTrader and press <code className="bg-blue-100 px-2 py-1 rounded">F4</code> to open MetaEditor.</li>
                  <li>Open the downloaded <code className="bg-blue-100 px-2 py-1 rounded">GreenTurtleTradesEA</code> file.</li>
                  <li>Click <strong>Compile</strong> (F7) and confirm you see "0 errors".</li>
                  <li>In MetaTrader, go to <strong>Tools → Options → Expert Advisors</strong>.</li>
                  <li>Allow WebRequest for <code className="bg-blue-100 px-2 py-1 rounded">http://localhost:3001</code> in local development, or your live API host in production.</li>
                  <li>Attach the EA to a chart and leave MetaTrader running while you use Turtle Analytics. The file already includes your generated API key and broker account link.</li>
                  <li>When you press <strong>Run Model</strong>, the backend requests a fresh historical export from the EA automatically.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {downloadInfo && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-emerald-900 mb-2">EA Download Ready</h3>
                  <p className="text-emerald-800 text-sm">
                    Your {downloadInfo.platform} EA was generated with the managed API key ending <strong>{downloadInfo.apiKeyLast4}</strong> and linked to broker account <strong>{downloadInfo.brokerAccountNumber}</strong>.
                  </p>
                  <p className="text-emerald-700 text-xs mt-2">
                    Broker account ID: {downloadInfo.brokerAccountId}
                  </p>
                </div>
              </div>
            </div>
          )}

          {downloadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {downloadError}
            </div>
          )}

          {(["MT4", "MT5"] as const).map((platform, index) => (
            <motion.div
              key={platform}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.2 }}
              className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-800 text-white px-6 py-4 flex items-center gap-3">
                <FileCode className="w-6 h-6 text-teal-400" />
                <div>
                  <h2 className="text-xl">MetaTrader {platform === "MT4" ? "4" : "5"} ({platform}) Expert Advisor</h2>
                  <p className="text-slate-400 text-sm">
                    Download a trader-linked {platform} source file for your current account.
                  </p>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-slate-600 mb-6">
                  This download is generated by the backend at request time. It includes a fresh managed API key and your linked broker account ID so the EA is matched to your trader account automatically.
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  The EA is configured for on-demand historical exports. It polls for a backend request and uploads closed trade history when you trigger a model run.
                </p>
                <button
                  onClick={() => handleDownload(platform)}
                  disabled={downloadingPlatform !== null}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {downloadingPlatform === platform ? `Generating ${platform} EA...` : `Download ${platform} EA`}
                </button>
              </div>
            </motion.div>
          ))}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-amber-900 mb-2">Managed Credentials</h3>
                <p className="text-amber-800 text-sm mb-3">
                  Downloading an EA file generates a managed <strong>MetaTrader EA</strong> API key for your account and links it to your broker account in the backend.
                </p>
                <ul className="text-amber-800 text-sm space-y-1 list-disc list-inside">
                  <li>The linked key will appear in your Settings and API Keys pages.</li>
                  <li>The generated file contains the key, so only download it on a trusted device.</li>
                  <li>If you download again, a new managed EA key will be issued and older managed EA keys are revoked.</li>
                </ul>
              </div>
            </div>
          </div>

          {isOnboarding && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-8 border border-teal-200"
            >
              <div className="text-center mb-6">
                <h3 className="text-slate-900 mb-2 text-2xl">Ready to Continue?</h3>
                <p className="text-slate-600">
                  You can always download the EA again later from your dashboard settings.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onSkip}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                  I'll Set This Up Later
                </button>
                <button
                  onClick={onComplete}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 rounded-lg transition-all shadow-lg"
                >
                  Continue to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
