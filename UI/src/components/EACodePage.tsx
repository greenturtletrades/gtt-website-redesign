import { useState } from "react";
import { Copy, Check, Download, Code, AlertCircle, FileCode, BookOpen, ArrowRight, SkipForward } from "lucide-react";
import { motion } from "motion/react";

interface EACodePageProps {
  isOnboarding?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function EACodePage({ isOnboarding = false, onComplete, onSkip }: EACodePageProps = {}) {
  const [copiedMT4, setCopiedMT4] = useState(false);
  const [copiedMT5, setCopiedMT5] = useState(false);

  const mt4Code = `//+------------------------------------------------------------------+
//|                                        Green Turtle Trades EA.mq4 |
//|                              Copyright 2024, Green Turtle Trades |
//|                                   https://greenturtletrades.com |
//+------------------------------------------------------------------+
#property copyright "Green Turtle Trades"
#property link      "https://greenturtletrades.com"
#property version   "1.00"
#property strict

// External parameters
input string API_KEY = "YOUR_API_KEY_HERE";           // Your API Key from GTT Dashboard
input int SYNC_INTERVAL = 5;                          // Sync interval in seconds
input bool ENABLE_LIVE_SYNC = true;                   // Enable live trade syncing

// Global variables
string apiEndpoint = "https://api.greenturtletrades.com/v1/trades";
datetime lastSyncTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Green Turtle Trades EA initialized");
   Print("API Key: ", StringSubstr(API_KEY, 0, 8), "...");
   
   if(API_KEY == "YOUR_API_KEY_HERE")
   {
      Alert("Please set your API Key in the EA settings!");
      return(INIT_FAILED);
   }
   
   // Test API connection
   if(!TestConnection())
   {
      Alert("Failed to connect to Green Turtle Trades API. Check your internet and API key.");
      return(INIT_FAILED);
   }
   
   Print("Successfully connected to Green Turtle Trades");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Green Turtle Trades EA stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!ENABLE_LIVE_SYNC) return;
   
   // Sync trades at specified interval
   if(TimeCurrent() - lastSyncTime >= SYNC_INTERVAL)
   {
      SyncTrades();
      lastSyncTime = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Sync all closed trades to Green Turtle Trades                    |
//+------------------------------------------------------------------+
void SyncTrades()
{
   int totalOrders = OrdersHistoryTotal();
   string tradesJson = "[";
   int syncedCount = 0;
   
   for(int i = totalOrders - 1; i >= 0 && syncedCount < 100; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         if(OrderCloseTime() > lastSyncTime || lastSyncTime == 0)
         {
            if(syncedCount > 0) tradesJson += ",";
            
            tradesJson += "{";
            tradesJson += "\\"ticket\\":" + IntegerToString(OrderTicket()) + ",";
            tradesJson += "\\"symbol\\":\\"" + OrderSymbol() + "\\",";
            tradesJson += "\\"type\\":\\"" + OrderTypeString(OrderType()) + "\\",";
            tradesJson += "\\"lots\\":" + DoubleToString(OrderLots(), 2) + ",";
            tradesJson += "\\"openPrice\\":" + DoubleToString(OrderOpenPrice(), 5) + ",";
            tradesJson += "\\"closePrice\\":" + DoubleToString(OrderClosePrice(), 5) + ",";
            tradesJson += "\\"openTime\\":\\"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\\",";
            tradesJson += "\\"closeTime\\":\\"" + TimeToString(OrderCloseTime(), TIME_DATE|TIME_SECONDS) + "\\",";
            tradesJson += "\\"profit\\":" + DoubleToString(OrderProfit(), 2) + ",";
            tradesJson += "\\"commission\\":" + DoubleToString(OrderCommission(), 2) + ",";
            tradesJson += "\\"swap\\":" + DoubleToString(OrderSwap(), 2);
            tradesJson += "}";
            
            syncedCount++;
         }
      }
   }
   
   tradesJson += "]";
   
   if(syncedCount > 0)
   {
      SendToAPI(tradesJson);
      Print("Synced ", syncedCount, " trades to Green Turtle Trades");
   }
}

//+------------------------------------------------------------------+
//| Test API connection                                               |
//+------------------------------------------------------------------+
bool TestConnection()
{
   string headers = "Content-Type: application/json\\r\\n";
   headers += "Authorization: Bearer " + API_KEY + "\\r\\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   string testUrl = "https://api.greenturtletrades.com/v1/test";
   
   int res = WebRequest("GET", testUrl, headers, 5000, post, result, resultHeaders);
   
   if(res == 200) return true;
   
   Print("Connection test failed with code: ", res);
   return false;
}

//+------------------------------------------------------------------+
//| Send trade data to API                                           |
//+------------------------------------------------------------------+
void SendToAPI(string jsonData)
{
   string headers = "Content-Type: application/json\\r\\n";
   headers += "Authorization: Bearer " + API_KEY + "\\r\\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, post, 0, StringLen(jsonData));
   
   int res = WebRequest("POST", apiEndpoint, headers, 5000, post, result, resultHeaders);
   
   if(res != 200)
   {
      Print("Failed to send data to API. Response code: ", res);
   }
}

//+------------------------------------------------------------------+
//| Convert order type to string                                     |
//+------------------------------------------------------------------+
string OrderTypeString(int type)
{
   switch(type)
   {
      case OP_BUY:       return "BUY";
      case OP_SELL:      return "SELL";
      case OP_BUYLIMIT:  return "BUY_LIMIT";
      case OP_SELLLIMIT: return "SELL_LIMIT";
      case OP_BUYSTOP:   return "BUY_STOP";
      case OP_SELLSTOP:  return "SELL_STOP";
      default:           return "UNKNOWN";
   }
}
//+------------------------------------------------------------------+`;

  const mt5Code = `//+------------------------------------------------------------------+
//|                                        Green Turtle Trades EA.mq5 |
//|                              Copyright 2024, Green Turtle Trades |
//|                                   https://greenturtletrades.com |
//+------------------------------------------------------------------+
#property copyright "Green Turtle Trades"
#property link      "https://greenturtletrades.com"
#property version   "1.00"

// External parameters
input string API_KEY = "YOUR_API_KEY_HERE";           // Your API Key from GTT Dashboard
input int SYNC_INTERVAL = 5;                          // Sync interval in seconds
input bool ENABLE_LIVE_SYNC = true;                   // Enable live trade syncing

// Global variables
string apiEndpoint = "https://api.greenturtletrades.com/v1/trades";
datetime lastSyncTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Green Turtle Trades EA initialized");
   Print("API Key: ", StringSubstr(API_KEY, 0, 8), "...");
   
   if(API_KEY == "YOUR_API_KEY_HERE")
   {
      Alert("Please set your API Key in the EA settings!");
      return(INIT_FAILED);
   }
   
   // Test API connection
   if(!TestConnection())
   {
      Alert("Failed to connect to Green Turtle Trades API. Check your internet and API key.");
      return(INIT_FAILED);
   }
   
   Print("Successfully connected to Green Turtle Trades");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Green Turtle Trades EA stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!ENABLE_LIVE_SYNC) return;
   
   // Sync trades at specified interval
   if(TimeCurrent() - lastSyncTime >= SYNC_INTERVAL)
   {
      SyncTrades();
      lastSyncTime = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Sync all closed trades to Green Turtle Trades                    |
//+------------------------------------------------------------------+
void SyncTrades()
{
   HistorySelect(0, TimeCurrent());
   int totalDeals = HistoryDealsTotal();
   string tradesJson = "[";
   int syncedCount = 0;
   
   for(int i = totalDeals - 1; i >= 0 && syncedCount < 100; i--)
   {
      ulong ticket = HistoryDealGetTicket(i);
      
      if(ticket > 0)
      {
         datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
         
         if(dealTime > lastSyncTime || lastSyncTime == 0)
         {
            if(syncedCount > 0) tradesJson += ",";
            
            ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
            
            if(entry == DEAL_ENTRY_OUT)
            {
               tradesJson += "{";
               tradesJson += "\\"ticket\\":" + IntegerToString(ticket) + ",";
               tradesJson += "\\"symbol\\":\\"" + HistoryDealGetString(ticket, DEAL_SYMBOL) + "\\",";
               tradesJson += "\\"type\\":\\"" + DealTypeString((ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE)) + "\\",";
               tradesJson += "\\"volume\\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_VOLUME), 2) + ",";
               tradesJson += "\\"price\\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PRICE), 5) + ",";
               tradesJson += "\\"time\\":\\"" + TimeToString(dealTime, TIME_DATE|TIME_SECONDS) + "\\",";
               tradesJson += "\\"profit\\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_PROFIT), 2) + ",";
               tradesJson += "\\"commission\\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_COMMISSION), 2) + ",";
               tradesJson += "\\"swap\\":" + DoubleToString(HistoryDealGetDouble(ticket, DEAL_SWAP), 2);
               tradesJson += "}";
               
               syncedCount++;
            }
         }
      }
   }
   
   tradesJson += "]";
   
   if(syncedCount > 0)
   {
      SendToAPI(tradesJson);
      Print("Synced ", syncedCount, " trades to Green Turtle Trades");
   }
}

//+------------------------------------------------------------------+
//| Test API connection                                               |
//+------------------------------------------------------------------+
bool TestConnection()
{
   string headers = "Content-Type: application/json\\r\\n";
   headers += "Authorization: Bearer " + API_KEY + "\\r\\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   string testUrl = "https://api.greenturtletrades.com/v1/test";
   
   int res = WebRequest("GET", testUrl, headers, 5000, post, result, resultHeaders);
   
   if(res == 200) return true;
   
   Print("Connection test failed with code: ", res);
   return false;
}

//+------------------------------------------------------------------+
//| Send trade data to API                                           |
//+------------------------------------------------------------------+
void SendToAPI(string jsonData)
{
   string headers = "Content-Type: application/json\\r\\n";
   headers += "Authorization: Bearer " + API_KEY + "\\r\\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, post, 0, StringLen(jsonData));
   
   int res = WebRequest("POST", apiEndpoint, headers, 5000, post, result, resultHeaders);
   
   if(res != 200)
   {
      Print("Failed to send data to API. Response code: ", res);
   }
}

//+------------------------------------------------------------------+
//| Convert deal type to string                                      |
//+------------------------------------------------------------------+
string DealTypeString(ENUM_DEAL_TYPE type)
{
   switch(type)
   {
      case DEAL_TYPE_BUY:  return "BUY";
      case DEAL_TYPE_SELL: return "SELL";
      default:             return "UNKNOWN";
   }
}
//+------------------------------------------------------------------+`;

  const handleCopy = (code: string, platform: "mt4" | "mt5") => {
    navigator.clipboard.writeText(code);
    if (platform === "mt4") {
      setCopiedMT4(true);
      setTimeout(() => setCopiedMT4(false), 2000);
    } else {
      setCopiedMT5(true);
      setTimeout(() => setCopiedMT5(false), 2000);
    }
  };

  const handleDownload = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="w-full bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white pt-32 sm:pt-36 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileCode className="w-8 h-8" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl">MetaTrader EA Code</h1>
            </div>
            <p className="text-teal-100 text-lg max-w-3xl">
              Copy and paste this Expert Advisor code into your MetaTrader platform to automatically sync your trades with Green Turtle Trades and enable Turtle Analytics.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Instructions */}
      <section className="w-full bg-white py-8 px-4 sm:px-6 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-blue-900 mb-2">Installation Instructions</h3>
                <ol className="text-blue-800 text-sm space-y-2 list-decimal list-inside">
                  <li>Copy the EA code for your platform (MT4 or MT5) using the button below</li>
                  <li>Open MetaTrader and press <code className="bg-blue-100 px-2 py-1 rounded">F4</code> to open MetaEditor</li>
                  <li>Click <strong>File → New → Expert Advisor (template)</strong></li>
                  <li>Name it "GreenTurtleTradesEA" and click through the wizard</li>
                  <li>Delete all the template code and paste the code you copied</li>
                  <li>Click <strong>Compile</strong> (F7) - you should see "0 errors"</li>
                  <li>In your MetaTrader terminal, go to <strong>Tools → Options → Expert Advisors</strong></li>
                  <li>Check "Allow WebRequest for listed URL" and add: <code className="bg-blue-100 px-2 py-1 rounded">https://api.greenturtletrades.com</code></li>
                  <li>Drag the EA from Navigator onto any chart</li>
                  <li>In the settings, replace <code className="bg-blue-100 px-2 py-1 rounded">YOUR_API_KEY_HERE</code> with your actual API key from your dashboard</li>
                  <li>Click OK - the EA will start syncing your trades automatically!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Sections */}
      <section className="w-full py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* MT4 Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code className="w-6 h-6 text-teal-400" />
                <div>
                  <h2 className="text-xl">MetaTrader 4 (MT4) Expert Advisor</h2>
                  <p className="text-slate-400 text-sm">For MT4 platforms - GreenTurtleTradesEA.mq4</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(mt4Code, "GreenTurtleTradesEA.mq4")}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => handleCopy(mt4Code, "mt4")}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                >
                  {copiedMT4 ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-6 bg-slate-900 overflow-x-auto">
              <pre className="text-sm text-slate-300 font-mono leading-relaxed">
                <code>{mt4Code}</code>
              </pre>
            </div>
          </motion.div>

          {/* MT5 Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code className="w-6 h-6 text-teal-400" />
                <div>
                  <h2 className="text-xl">MetaTrader 5 (MT5) Expert Advisor</h2>
                  <p className="text-slate-400 text-sm">For MT5 platforms - GreenTurtleTradesEA.mq5</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(mt5Code, "GreenTurtleTradesEA.mq5")}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => handleCopy(mt5Code, "mt5")}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                >
                  {copiedMT5 ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-6 bg-slate-900 overflow-x-auto">
              <pre className="text-sm text-slate-300 font-mono leading-relaxed">
                <code>{mt5Code}</code>
              </pre>
            </div>
          </motion.div>

          {/* API Key Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-amber-900 mb-2">Where to Find Your API Key</h3>
                <p className="text-amber-800 text-sm mb-3">
                  Your unique API key is required to connect the EA to your Green Turtle Trades account. You can find it in:
                </p>
                <ul className="text-amber-800 text-sm space-y-1 list-disc list-inside">
                  <li><strong>Trader Dashboard → Settings → API Keys</strong></li>
                  <li>Keep your API key secret - it's like a password for your account</li>
                  <li>You can regenerate your API key anytime if it's compromised</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Onboarding Actions */}
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
                  You can always access this EA code later from your dashboard settings. Let's explore your Turtle Analytics!
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