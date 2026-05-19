import unittest

import pandas as pd

from turtle_analytics.csv_parsing import map_csv_columns


class Trading212CsvParsingTests(unittest.TestCase):
    def test_trading212_history_csv_is_mapped_into_closed_trades(self) -> None:
        df = pd.DataFrame(
            [
                {
                    "Action": "Market buy",
                    "Time": "2026-02-06 17:17:52",
                    "Ticker": "QCOM",
                    "ID": "BUY1",
                    "No. of shares": 5.0,
                    "Price / share": 138.54,
                    "Result": None,
                    "Currency conversion fee": 0.76,
                },
                {
                    "Action": "Market sell",
                    "Time": "2026-04-28 10:16:48",
                    "Ticker": "QCOM",
                    "ID": "SELL1",
                    "No. of shares": 5.0,
                    "Price / share": 144.51,
                    "Result": 26.66,
                    "Currency conversion fee": 0.80,
                },
            ]
        )

        trades = map_csv_columns(df)

        self.assertEqual(len(trades), 1)
        trade = trades[0]
        self.assertEqual(trade["symbol"], "QCOM")
        self.assertEqual(trade["side"], "LONG")
        self.assertEqual(trade["entry_time"], "2026-02-06 17:17:52")
        self.assertEqual(trade["exit_time"], "2026-04-28 10:16:48")
        self.assertEqual(trade["entry_price"], 138.54)
        self.assertEqual(trade["exit_price"], 144.51)
        self.assertEqual(trade["volume"], 5.0)
        self.assertEqual(trade["profit"], 26.66)
        self.assertEqual(trade["commission"], -1.56)

    def test_trading212_history_csv_ignores_non_trade_rows_and_supports_partial_matches(self) -> None:
        df = pd.DataFrame(
            [
                {
                    "Action": "Deposit",
                    "Time": "2026-02-11 11:39:47",
                    "Ticker": None,
                    "ID": "DEP1",
                    "No. of shares": None,
                    "Price / share": None,
                    "Result": None,
                    "Currency conversion fee": None,
                },
                {
                    "Action": "Market buy",
                    "Time": "2026-03-16 13:45:31",
                    "Ticker": "UHS",
                    "ID": "BUY1",
                    "No. of shares": 3.0,
                    "Price / share": 196.38,
                    "Result": None,
                    "Currency conversion fee": 0.66,
                },
                {
                    "Action": "Market buy",
                    "Time": "2026-03-16 13:45:35",
                    "Ticker": "UHS",
                    "ID": "BUY2",
                    "No. of shares": 0.3858415,
                    "Price / share": 197.74,
                    "Result": None,
                    "Currency conversion fee": 0.09,
                },
                {
                    "Action": "Market sell",
                    "Time": "2026-04-16 12:00:00",
                    "Ticker": "UHS",
                    "ID": "SELL1",
                    "No. of shares": 3.1,
                    "Price / share": 210.0,
                    "Result": 40.0,
                    "Currency conversion fee": 0.5,
                },
            ]
        )

        trades = map_csv_columns(df)

        self.assertEqual(len(trades), 2)
        self.assertEqual(trades[0]["volume"], 3.0)
        self.assertEqual(round(trades[1]["volume"], 6), 0.1)
        self.assertEqual(trades[0]["symbol"], "UHS")
        self.assertEqual(trades[1]["symbol"], "UHS")

    def test_trading212_history_csv_supports_short_trades(self) -> None:
        df = pd.DataFrame(
            [
                {
                    "Action": "Market sell",
                    "Time": "2026-02-10 10:00:00",
                    "Ticker": "TSLA",
                    "ID": "SELL_OPEN",
                    "No. of shares": 2.0,
                    "Price / share": 300.0,
                    "Result": None,
                    "Currency conversion fee": 0.5,
                },
                {
                    "Action": "Market buy",
                    "Time": "2026-02-12 15:30:00",
                    "Ticker": "TSLA",
                    "ID": "BUY_CLOSE",
                    "No. of shares": 2.0,
                    "Price / share": 270.0,
                    "Result": 60.0,
                    "Currency conversion fee": 0.4,
                },
            ]
        )

        trades = map_csv_columns(df)

        self.assertEqual(len(trades), 1)
        trade = trades[0]
        self.assertEqual(trade["side"], "SHORT")
        self.assertEqual(trade["symbol"], "TSLA")
        self.assertEqual(trade["entry_price"], 300.0)
        self.assertEqual(trade["exit_price"], 270.0)
        self.assertEqual(trade["profit"], 60.0)
        self.assertEqual(trade["commission"], -0.9)

    def test_trading212_history_csv_buy_can_close_short_then_open_long(self) -> None:
        df = pd.DataFrame(
            [
                {
                    "Action": "Market sell",
                    "Time": "2026-03-01 09:00:00",
                    "Ticker": "NVDA",
                    "ID": "SELL_OPEN",
                    "No. of shares": 1.0,
                    "Price / share": 120.0,
                    "Result": None,
                    "Currency conversion fee": 0.2,
                },
                {
                    "Action": "Market buy",
                    "Time": "2026-03-02 09:00:00",
                    "Ticker": "NVDA",
                    "ID": "BUY_MIXED",
                    "No. of shares": 2.0,
                    "Price / share": 100.0,
                    "Result": 20.0,
                    "Currency conversion fee": 0.3,
                },
                {
                    "Action": "Market sell",
                    "Time": "2026-03-03 09:00:00",
                    "Ticker": "NVDA",
                    "ID": "SELL_CLOSE_LONG",
                    "No. of shares": 1.0,
                    "Price / share": 110.0,
                    "Result": 10.0,
                    "Currency conversion fee": 0.1,
                },
            ]
        )

        trades = map_csv_columns(df)

        self.assertEqual(len(trades), 2)
        self.assertEqual(trades[0]["side"], "SHORT")
        self.assertEqual(trades[0]["volume"], 1.0)
        self.assertEqual(trades[1]["side"], "LONG")
        self.assertEqual(trades[1]["volume"], 1.0)
        self.assertEqual(trades[1]["entry_price"], 100.0)
        self.assertEqual(trades[1]["exit_price"], 110.0)


if __name__ == "__main__":
    unittest.main()
