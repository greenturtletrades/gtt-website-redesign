//+------------------------------------------------------------------+
//|                          GreenTurtleTradesEA.mq5                 |
//+------------------------------------------------------------------+
#property version   "1.00"

input string API_BASE_URL = "https://back.greenturtletraders.co.uk";
input string API_KEY = "gt_ae51d1e26488117214105999d4b66934c92a34c2a9935894";
input string BROKER_ACCOUNT_ID = "cmo7qeibt000m0ppru2tofrj5";
input int EXPORT_POLL_SECONDS = 10;
input int HEARTBEAT_SECONDS = 60;
input int HISTORY_LOOKBACK_DAYS = 3650;
input int MAX_TRADES_PER_EXPORT = 5000;
// Market context features for regime clustering.
// Uses MARKET_CONTEXT_TF bars before each trade entry to compute ATR,
// EMA direction, bar range, price position in range, and volume ratio.
// These replace outcome-based features (win rate, avg R) in the clustering
// model with genuine market structure signals known at entry time.
input ENUM_TIMEFRAMES MARKET_CONTEXT_TF = PERIOD_H1; // Timeframe for regime features
input int MARKET_CONTEXT_BARS = 20;                  // Lookback bars for rolling features
input int ATR_PERIOD = 14;                           // ATR period

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
   body += "\"source\":\"mt5_ea\",";
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

ulong FindEntryDeal(ulong positionId, datetime exitTime)
{
   int totalDeals = HistoryDealsTotal();
   for(int i = totalDeals - 1; i >= 0; i--)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;
      if((ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID) != positionId) continue;

      ENUM_DEAL_ENTRY entryType = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
      datetime dealTime = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      if((entryType == DEAL_ENTRY_IN || entryType == DEAL_ENTRY_INOUT) && dealTime <= exitTime)
      {
         return(ticket);
      }
   }
   return(0);
}

ulong FindLatestOrderForPosition(ulong positionId, datetime exitTime)
{
   int totalOrders = HistoryOrdersTotal();
   ulong latestTicket = 0;
   datetime latestTime = 0;

   for(int i = totalOrders - 1; i >= 0; i--)
   {
      ulong ticket = HistoryOrderGetTicket(i);
      if(ticket == 0) continue;
      if((ulong)HistoryOrderGetInteger(ticket, ORDER_POSITION_ID) != positionId) continue;

      datetime orderTime = (datetime)HistoryOrderGetInteger(ticket, ORDER_TIME_DONE);
      if(orderTime == 0)
      {
         orderTime = (datetime)HistoryOrderGetInteger(ticket, ORDER_TIME_SETUP);
      }
      if(orderTime > exitTime) continue;
      if(orderTime >= latestTime)
      {
         latestTime = orderTime;
         latestTicket = ticket;
      }
   }

   return(latestTicket);
}

bool ComputeTradeExcursions(string symbol, datetime entryTime, datetime exitTime, bool isLong, double entryPrice, double &mfe, double &mae)
{
   mfe = 0.0;
   mae = 0.0;

   MqlRates rates[];
   int copied = CopyRates(symbol, PERIOD_M1, entryTime, exitTime, rates);
   if(copied <= 0)
   {
      return(false);
   }

   double maxHigh = entryPrice;
   double minLow = entryPrice;
   for(int i = 0; i < copied; i++)
   {
      if(rates[i].high > maxHigh) maxHigh = rates[i].high;
      if(rates[i].low < minLow) minLow = rates[i].low;
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

bool ComputeMarketContext(string symbol, datetime entryTime,
                          double &atrPct, double &barRangePct,
                          double &emaDirection, double &priceInRange,
                          double &volumeRatio)
{
   atrPct       = 0.0;
   barRangePct  = 0.0;
   emaDirection = 0.0;
   priceInRange = 0.5;
   volumeRatio  = 1.0;

   // Fetch enough bars before entry for ATR + EMA + buffer
   int barsNeeded = MARKET_CONTEXT_BARS + ATR_PERIOD + 5;
   MqlRates rates[];
   ArraySetAsSeries(rates, false);

   // Request bars ending at entryTime
   int copied = CopyRates(symbol, MARKET_CONTEXT_TF, 0, barsNeeded + 50, rates);
   if(copied < 5) return false;

   // Find the index of the bar that was current at entryTime (strictly before entry)
   int endIdx = -1;
   for(int i = copied - 1; i >= 0; i--)
   {
      if(rates[i].time < entryTime)
      {
         endIdx = i;
         break;
      }
   }
   if(endIdx < 4) return false;

   int startIdx = MathMax(0, endIdx - MARKET_CONTEXT_BARS + 1);
   int n = endIdx - startIdx + 1;
   double lastClose = rates[endIdx].close;
   if(lastClose <= 0.0) return false;

   // --- ATR (14-bar true range average) ---
   int atrStart = MathMax(1, endIdx - ATR_PERIOD + 1);
   double trSum = 0.0;
   int trCount = 0;
   for(int i = atrStart; i <= endIdx; i++)
   {
      double prevClose = rates[i - 1].close;
      double tr = MathMax(rates[i].high - rates[i].low,
                  MathMax(MathAbs(rates[i].high - prevClose),
                          MathAbs(rates[i].low  - prevClose)));
      trSum += tr;
      trCount++;
   }
   atrPct = (trCount > 0) ? (trSum / trCount) / lastClose : 0.0;

   // --- Most recent bar range as % of price ---
   barRangePct = (rates[endIdx].high - rates[endIdx].low) / lastClose;

   // --- 20-bar EMA direction ---
   int emaPeriod = MathMin(MARKET_CONTEXT_BARS, n);
   int emaStart  = endIdx - emaPeriod + 1;
   double ema    = rates[emaStart].close;
   double k      = 2.0 / (emaPeriod + 1);
   for(int i = emaStart + 1; i <= endIdx; i++)
      ema = rates[i].close * k + ema * (1.0 - k);
   emaDirection = (lastClose > ema) ? 1.0 : 0.0;

   // --- Price position in lookback H-L range (0 = at lows, 1 = at highs) ---
   double rangeHigh = rates[startIdx].high;
   double rangeLow  = rates[startIdx].low;
   for(int i = startIdx + 1; i <= endIdx; i++)
   {
      if(rates[i].high > rangeHigh) rangeHigh = rates[i].high;
      if(rates[i].low  < rangeLow)  rangeLow  = rates[i].low;
   }
   double rangeSize = rangeHigh - rangeLow;
   priceInRange = (rangeSize > 0.0) ? (lastClose - rangeLow) / rangeSize : 0.5;

   // --- Volume ratio: latest bar vs lookback average ---
   long volSum = 0;
   for(int i = startIdx; i <= endIdx; i++) volSum += rates[i].tick_volume;
   double avgVol = (n > 0) ? (double)volSum / n : 0.0;
   volumeRatio = (avgVol > 0.0) ? (double)rates[endIdx].tick_volume / avgVol : 1.0;

   return true;
}

void ExportClosedTrades(string requestToken)
{
   if(!HistorySelect(0, TimeCurrent())) return;

   int totalDeals = HistoryDealsTotal();
   int exported = 0;
   string body = "{\"trades\":[";
   datetime minCloseTime = TimeCurrent() - (HISTORY_LOOKBACK_DAYS * 24 * 60 * 60);

   for(int i = totalDeals - 1; i >= 0 && exported < MAX_TRADES_PER_EXPORT; i--)
   {
      ulong exitTicket = HistoryDealGetTicket(i);
      if(exitTicket == 0) continue;

      ENUM_DEAL_ENTRY exitEntry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(exitTicket, DEAL_ENTRY);
      ENUM_DEAL_TYPE exitType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(exitTicket, DEAL_TYPE);
      if(exitEntry != DEAL_ENTRY_OUT) continue;
      if(exitType != DEAL_TYPE_BUY && exitType != DEAL_TYPE_SELL) continue;

      datetime exitTime = (datetime)HistoryDealGetInteger(exitTicket, DEAL_TIME);
      if(exitTime <= 0) continue;
      if(HISTORY_LOOKBACK_DAYS > 0 && exitTime < minCloseTime) continue;

      ulong positionId = (ulong)HistoryDealGetInteger(exitTicket, DEAL_POSITION_ID);
      ulong entryTicket = FindEntryDeal(positionId, exitTime);
      if(entryTicket == 0) continue;

      ulong orderTicket = (ulong)HistoryDealGetInteger(entryTicket, DEAL_ORDER);
      ulong latestOrderTicket = FindLatestOrderForPosition(positionId, exitTime);
      ulong slTpOrderTicket = latestOrderTicket != 0 ? latestOrderTicket : orderTicket;
      HistoryOrderSelect(slTpOrderTicket);
      string symbol = HistoryDealGetString(exitTicket, DEAL_SYMBOL);
      int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
      bool isLong = HistoryDealGetInteger(entryTicket, DEAL_TYPE) == DEAL_TYPE_BUY;
      double mfe = 0.0;
      double mae = 0.0;
      datetime tradeEntryTime = (datetime)HistoryDealGetInteger(entryTicket, DEAL_TIME);
      ComputeTradeExcursions(symbol, tradeEntryTime, exitTime, isLong, HistoryDealGetDouble(entryTicket, DEAL_PRICE), mfe, mae);

      double atrPct = 0.0, barRangePct = 0.0, emaDirection = 0.0, priceInRange = 0.5, volumeRatio = 1.0;
      ComputeMarketContext(symbol, tradeEntryTime, atrPct, barRangePct, emaDirection, priceInRange, volumeRatio);

      if(exported > 0) body += ",";

      body += "{";
      body += "\"trade_id\":\"" + IntegerToString((int)exitTicket) + "\",";
      body += "\"entry_time\":\"" + TimeToString(tradeEntryTime, TIME_DATE|TIME_SECONDS) + "\",";
      body += "\"exit_time\":\"" + TimeToString(exitTime, TIME_DATE|TIME_SECONDS) + "\",";
      body += "\"side\":\"" + (isLong ? "LONG" : "SHORT") + "\",";
      body += "\"entry_price\":" + DoubleToString(HistoryDealGetDouble(entryTicket, DEAL_PRICE), digits) + ",";
      body += "\"exit_price\":" + DoubleToString(HistoryDealGetDouble(exitTicket, DEAL_PRICE), digits) + ",";
      body += "\"stop_loss\":" + DoubleToString(HistoryOrderGetDouble(slTpOrderTicket, ORDER_SL), digits) + ",";
      body += "\"take_profit\":" + DoubleToString(HistoryOrderGetDouble(slTpOrderTicket, ORDER_TP), digits) + ",";
      body += "\"mfe\":" + DoubleToString(mfe, digits) + ",";
      body += "\"mae\":" + DoubleToString(mae, digits) + ",";
      body += "\"symbol\":\"" + symbol + "\",";
      body += "\"volume\":" + DoubleToString(HistoryDealGetDouble(exitTicket, DEAL_VOLUME), 2) + ",";
      body += "\"profit\":" + DoubleToString(HistoryDealGetDouble(exitTicket, DEAL_PROFIT), 2) + ",";
      body += "\"commission\":" + DoubleToString(HistoryDealGetDouble(exitTicket, DEAL_COMMISSION), 2) + ",";
      body += "\"swap\":" + DoubleToString(HistoryDealGetDouble(exitTicket, DEAL_SWAP), 2) + ",";
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
   body += "\"source\":\"mt5_ea_history\"";
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