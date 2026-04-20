//+------------------------------------------------------------------+
//|                          GreenTurtleTradesEA.mq4                 |
//+------------------------------------------------------------------+
#property strict

input string API_BASE_URL = "https://back.greenturtletraders.co.uk";
input string API_KEY = "gt_b1cd90c3cfa67d7277c8fa9a15b242826effacf279e7a473";
input string BROKER_ACCOUNT_ID = "cmo7qeibt000m0ppru2tofrj5";
input int EXPORT_POLL_SECONDS = 10;
input int HEARTBEAT_SECONDS = 60;
input int HISTORY_LOOKBACK_DAYS = 3650;
input int MAX_TRADES_PER_EXPORT = 5000;
// Market context features for regime clustering.
// Uses MARKET_CONTEXT_TF bars before each trade entry to compute ATR,
// EMA direction, bar range, price position in range, and volume ratio.
input int MARKET_CONTEXT_TF   = PERIOD_H1; // Timeframe for regime features
input int MARKET_CONTEXT_BARS = 20;        // Lookback bars for rolling features
input int ATR_PERIOD          = 14;        // ATR period

datetime lastPollTime = 0;
datetime lastHeartbeatTime = 0;
string lastRequestToken = "";

int OnInit()
{
   if(StringLen(API_KEY) < 12 || StringLen(BROKER_ACCOUNT_ID) < 6)
   {
      Alert("Green Turtle Trades EA is missing account credentials.");
      return(INIT_FAILED);
   }

   if(!TestConnection())
   {
      Alert("Unable to reach the Green Turtle Trades API.");
      return(INIT_FAILED);
   }

   EventSetTimer(MathMax(5, EXPORT_POLL_SECONDS));
   Print("Green Turtle Trades EA connected. Historical exports will run when requested from Turtle Analytics.");
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

bool TestConnection()
{
   string url = API_BASE_URL + "/health";
   string headers = "Content-Type: application/json\r\n";
   char post[];
   char result[];
   string responseHeaders;
   int status = WebRequest("GET", url, headers, 5000, post, result, responseHeaders);
   return(status == 200);
}

void SendHeartbeat()
{
   if(lastHeartbeatTime != 0 && TimeCurrent() - lastHeartbeatTime < MathMax(15, HEARTBEAT_SECONDS))
   {
      return;
   }

   string body = "{";
   body += "\"source\":\"mt4_ea\",";
   body += "\"heartbeatAt\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"";
   body += "}";

   if(SendJson("/v1/ea/heartbeat", body))
   {
      lastHeartbeatTime = TimeCurrent();
   }
}

bool FetchPendingExportToken(string &requestToken)
{
   string url = API_BASE_URL + "/v1/ea/export-request";
   string headers = "Content-Type: application/json\r\n";
   headers += "x-api-key: " + API_KEY + "\r\n";
   headers += "x-broker-account-id: " + BROKER_ACCOUNT_ID + "\r\n";

   char post[];
   char result[];
   string responseHeaders;
   int status = WebRequest("GET", url, headers, 5000, post, result, responseHeaders);
   if(status != 200)
   {
      return(false);
   }

   string body = CharArrayToString(result, 0, -1);
   if(StringFind(body, "\"pending\":true") == -1)
   {
      return(false);
   }

   int tokenKey = StringFind(body, "\"requestToken\":\"");
   if(tokenKey == -1)
   {
      return(false);
   }

   int start = tokenKey + StringLen("\"requestToken\":\"");
   int end = StringFind(body, "\"", start);
   if(end == -1)
   {
      return(false);
   }

   requestToken = StringSubstr(body, start, end - start);
   return(StringLen(requestToken) > 0);
}

bool ComputeTradeExcursions(string symbol, datetime entryTime, datetime exitTime, bool isLong, double entryPrice, double &mfe, double &mae)
{
   mfe = 0.0;
   mae = 0.0;

   int entryShift = iBarShift(symbol, PERIOD_M1, entryTime, false);
   int exitShift = iBarShift(symbol, PERIOD_M1, exitTime, false);
   if(entryShift < 0 || exitShift < 0)
   {
      return(false);
   }

   int firstShift = MathMin(entryShift, exitShift);
   int lastShift = MathMax(entryShift, exitShift);
   double maxHigh = entryPrice;
   double minLow = entryPrice;

   for(int shift = firstShift; shift <= lastShift; shift++)
   {
      double barHigh = iHigh(symbol, PERIOD_M1, shift);
      double barLow = iLow(symbol, PERIOD_M1, shift);
      if(barHigh > maxHigh) maxHigh = barHigh;
      if(barLow < minLow) minLow = barLow;
   }

   if(isLong)
   {
      mfe = MathMax(0.0, maxHigh - entryPrice);
      mae = MathMax(0.0, entryPrice - minLow);
   }
   else
   {
      mfe = MathMax(0.0, entryPrice - minLow);
      mae = MathMax(0.0, maxHigh - entryPrice);
   }

   return(true);
}

void ComputeMarketContext(string symbol, datetime entryTime,
                          double &atrPct, double &barRangePct,
                          double &emaDirection, double &priceInRange,
                          double &volumeRatio)
{
   atrPct       = 0.0;
   barRangePct  = 0.0;
   emaDirection = 0.0;
   priceInRange = 0.5;
   volumeRatio  = 1.0;

   // Bar shift of the last closed bar before entry (shift 0 = current, higher = older)
   int entryShift = iBarShift(symbol, MARKET_CONTEXT_TF, entryTime, false);
   if(entryShift < 0) return;

   // Need enough bars for lookback
   int barsAvailable = iBars(symbol, MARKET_CONTEXT_TF);
   if(entryShift + MARKET_CONTEXT_BARS + ATR_PERIOD + 2 > barsAvailable) return;

   double entryClose = iClose(symbol, MARKET_CONTEXT_TF, entryShift);
   if(entryClose <= 0.0) return;

   // --- ATR (14-bar) using MT4 built-in ---
   double atrValue = iATR(symbol, MARKET_CONTEXT_TF, ATR_PERIOD, entryShift);
   atrPct = atrValue / entryClose;

   // --- Most recent bar range as % of price ---
   double barHigh = iHigh(symbol, MARKET_CONTEXT_TF, entryShift);
   double barLow  = iLow(symbol,  MARKET_CONTEXT_TF, entryShift);
   barRangePct = (barHigh - barLow) / entryClose;

   // --- EMA direction using MT4 built-in ---
   double ema = iMA(symbol, MARKET_CONTEXT_TF, MARKET_CONTEXT_BARS, 0, MODE_EMA, PRICE_CLOSE, entryShift);
   emaDirection = (entryClose > ema) ? 1.0 : 0.0;

   // --- Price position in lookback H-L range ---
   int highestShift = iHighest(symbol, MARKET_CONTEXT_TF, MODE_HIGH, MARKET_CONTEXT_BARS, entryShift);
   int lowestShift  = iLowest (symbol, MARKET_CONTEXT_TF, MODE_LOW,  MARKET_CONTEXT_BARS, entryShift);
   double rangeHigh = iHigh(symbol, MARKET_CONTEXT_TF, highestShift);
   double rangeLow  = iLow (symbol, MARKET_CONTEXT_TF, lowestShift);
   double rangeSize = rangeHigh - rangeLow;
   priceInRange = (rangeSize > 0.0) ? (entryClose - rangeLow) / rangeSize : 0.5;

   // --- Volume ratio: entry bar vs lookback average ---
   long entryVol = iVolume(symbol, MARKET_CONTEXT_TF, entryShift);
   long volSum = 0;
   for(int v = entryShift; v < entryShift + MARKET_CONTEXT_BARS; v++)
      volSum += iVolume(symbol, MARKET_CONTEXT_TF, v);
   double avgVol = (double)volSum / MARKET_CONTEXT_BARS;
   volumeRatio = (avgVol > 0.0) ? (double)entryVol / avgVol : 1.0;
}

void ExportClosedTrades(string requestToken)
{
   int totalOrders = OrdersHistoryTotal();
   int exported = 0;
   string body = "{\"trades\":[";
   datetime minCloseTime = TimeCurrent() - (HISTORY_LOOKBACK_DAYS * 24 * 60 * 60);

   for(int i = totalOrders - 1; i >= 0 && exported < MAX_TRADES_PER_EXPORT; i--)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
      if(OrderType() != OP_BUY && OrderType() != OP_SELL) continue;
      if(OrderCloseTime() <= 0) continue;
      if(HISTORY_LOOKBACK_DAYS > 0 && OrderCloseTime() < minCloseTime) continue;

      if(exported > 0) body += ",";

      int digits = (int)MarketInfo(OrderSymbol(), MODE_DIGITS);
      bool isLong = OrderType() == OP_BUY;
      double mfe = 0.0;
      double mae = 0.0;
      ComputeTradeExcursions(OrderSymbol(), OrderOpenTime(), OrderCloseTime(), isLong, OrderOpenPrice(), mfe, mae);

      double atrPct = 0.0, barRangePct = 0.0, emaDirection = 0.0, priceInRange = 0.5, volumeRatio = 1.0;
      ComputeMarketContext(OrderSymbol(), OrderOpenTime(), atrPct, barRangePct, emaDirection, priceInRange, volumeRatio);

      body += "{";
      body += "\"trade_id\":\"" + IntegerToString(OrderTicket()) + "\",";
      body += "\"entry_time\":\"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\",";
      body += "\"exit_time\":\"" + TimeToString(OrderCloseTime(), TIME_DATE|TIME_SECONDS) + "\",";
      body += "\"side\":\"" + (isLong ? "LONG" : "SHORT") + "\",";
      body += "\"entry_price\":" + DoubleToString(OrderOpenPrice(), digits) + ",";
      body += "\"exit_price\":" + DoubleToString(OrderClosePrice(), digits) + ",";
      body += "\"stop_loss\":" + DoubleToString(OrderStopLoss(), digits) + ",";
      body += "\"take_profit\":" + DoubleToString(OrderTakeProfit(), digits) + ",";
      body += "\"mfe\":" + DoubleToString(mfe, digits) + ",";
      body += "\"mae\":" + DoubleToString(mae, digits) + ",";
      body += "\"symbol\":\"" + OrderSymbol() + "\",";
      body += "\"volume\":" + DoubleToString(OrderLots(), 2) + ",";
      body += "\"profit\":" + DoubleToString(OrderProfit(), 2) + ",";
      body += "\"commission\":" + DoubleToString(OrderCommission(), 2) + ",";
      body += "\"swap\":" + DoubleToString(OrderSwap(), 2) + ",";
      body += "\"atr_pct\":" + DoubleToString(atrPct, 6) + ",";
      body += "\"bar_range_pct\":" + DoubleToString(barRangePct, 6) + ",";
      body += "\"ema_direction\":" + DoubleToString(emaDirection, 1) + ",";
      body += "\"price_in_range\":" + DoubleToString(priceInRange, 4) + ",";
      body += "\"volume_ratio\":" + DoubleToString(volumeRatio, 4);
      body += "}";
      exported++;
   }

   body += "],";
   body += "\"requestToken\":\"" + requestToken + "\",";
   body += "\"source\":\"mt4_ea_history\"";
   body += "}";

   if(exported == 0) return;
   if(SendJson("/v1/ea/history/export", body))
   {
      Print("Green Turtle Trades EA exported ", exported, " historical trades.");
   }
}

bool SendJson(string path, string jsonBody)
{
   string url = API_BASE_URL + path;
   string headers = "Content-Type: application/json\r\n";
   headers += "x-api-key: " + API_KEY + "\r\n";
   headers += "x-broker-account-id: " + BROKER_ACCOUNT_ID + "\r\n";

   char post[];
   char result[];
   string responseHeaders;
   StringToCharArray(jsonBody, post, 0, StringLen(jsonBody));
   int status = WebRequest("POST", url, headers, 10000, post, result, responseHeaders);
   if(status != 200)
   {
      Print("Green Turtle Trades EA request failed: ", status);
      return(false);
   }
   return(true);
}

void CheckForRequestedExport()
{
   string requestToken = "";
   if(!FetchPendingExportToken(requestToken))
   {
      return;
   }

   if(StringLen(requestToken) == 0 || requestToken == lastRequestToken)
   {
      return;
   }

   lastRequestToken = requestToken;
   ExportClosedTrades(requestToken);
}

void OnTimer()
{
   SendHeartbeat();
   CheckForRequestedExport();
}

void OnTick()
{
   SendHeartbeat();
   if(TimeCurrent() - lastPollTime < MathMax(5, EXPORT_POLL_SECONDS))
   {
      return;
   }

   lastPollTime = TimeCurrent();
   CheckForRequestedExport();
}
//+------------------------------------------------------------------+