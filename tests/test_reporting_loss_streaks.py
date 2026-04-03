from pathlib import Path
import unittest

import pandas as pd

from turtle_analytics import io as tio
from turtle_analytics.features import add_basic_features, add_extended_features
from turtle_analytics.reporting import build_report


class ReportingLossStreakTests(unittest.TestCase):
    def test_sample_csv_loss_streak_analysis(self) -> None:
        csv_path = Path("data/raw/semi_profitable_mt_style_250.csv")
        df = pd.read_csv(csv_path)
        df = tio.validate_trades(df)
        df = add_basic_features(df)
        df = add_extended_features(df)

        report = build_report(df)
        rows = {
            row["loss_streak"]: row
            for row in report["trade_analytics"]["consecutive_loss_analysis"]
        }

        expected = {
            "1 Loss": {"occurrences": 64, "next_wins": 39, "next_win_rate": 0.609, "next_avg_r": 0.360},
            "2 Losses": {"occurrences": 26, "next_wins": 12, "next_win_rate": 0.462, "next_avg_r": 0.127},
            "3 Losses": {"occurrences": 14, "next_wins": 10, "next_win_rate": 0.714, "next_avg_r": 0.716},
            "4+ Losses": {"occurrences": 8, "next_wins": 3, "next_win_rate": 0.375, "next_avg_r": 0.084},
        }

        self.assertEqual(set(rows.keys()), set(expected.keys()))

        for label, values in expected.items():
            self.assertEqual(rows[label]["occurrences"], values["occurrences"])
            self.assertEqual(rows[label]["next_wins"], values["next_wins"])
            self.assertAlmostEqual(rows[label]["next_win_rate"], values["next_win_rate"], places=3)
            self.assertAlmostEqual(rows[label]["next_avg_r"], values["next_avg_r"], places=3)


if __name__ == "__main__":
    unittest.main()
