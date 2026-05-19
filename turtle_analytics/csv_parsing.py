from __future__ import annotations

from typing import Optional

import pandas as pd


def normalize_trade_side(value) -> Optional[str]:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    raw = str(value).strip().upper()
    if raw in {"BUY", "LONG", "BULL", "1"}:
        return "LONG"
    if raw in {"SELL", "SHORT", "BEAR", "-1"}:
        return "SHORT"
    return None


def infer_trade_side(
    entry_price: float,
    stop_loss: Optional[float] = None,
    take_profit: Optional[float] = None,
) -> Optional[str]:
    signals: list[str] = []

    if stop_loss is not None and pd.notna(stop_loss):
        if stop_loss < entry_price:
            signals.append("LONG")
        elif stop_loss > entry_price:
            signals.append("SHORT")

    if take_profit is not None and pd.notna(take_profit):
        if take_profit > entry_price:
            signals.append("LONG")
        elif take_profit < entry_price:
            signals.append("SHORT")

    if not signals:
        return None

    first_signal = signals[0]
    return first_signal if all(signal == first_signal for signal in signals) else None


def normalize_csv_column_name(value: str) -> str:
    return value.strip().lower().replace(" ", "_").replace("-", "_").replace("/", "_")


def safe_float(value) -> Optional[float]:
    numeric = pd.to_numeric(value, errors="coerce")
    if pd.isna(numeric):
        return None
    return float(numeric)


def is_trading212_history_csv(df: pd.DataFrame) -> bool:
    normalized_columns = {normalize_csv_column_name(column) for column in df.columns}
    required_columns = {
        "action",
        "time",
        "ticker",
        "id",
        "no._of_shares",
        "price___share",
    }
    return required_columns.issubset(normalized_columns)


def map_trading212_history_csv(df: pd.DataFrame) -> list[dict]:
    col_lookup = {normalize_csv_column_name(column): column for column in df.columns}

    def column(name: str) -> pd.Series:
        return df[col_lookup[name]]

    actions = column("action")
    times = column("time")
    tickers = column("ticker")
    trade_ids = column("id")
    quantities = column("no._of_shares")
    prices = column("price___share")
    results = column("result") if "result" in col_lookup else None
    fees = (
        column("currency_conversion_fee")
        if "currency_conversion_fee" in col_lookup
        else column("fee")
        if "fee" in col_lookup
        else None
    )

    long_inventory_by_ticker: dict[str, list[dict]] = {}
    short_inventory_by_ticker: dict[str, list[dict]] = {}
    closed_trades: list[dict] = []

    for index in range(len(df)):
        action_text = str(actions.iloc[index]).strip()
        action_lower = action_text.lower()
        ticker = str(tickers.iloc[index]).strip().upper()
        filled_at = str(times.iloc[index]).strip()
        trade_id = str(trade_ids.iloc[index]).strip()
        quantity = safe_float(quantities.iloc[index])
        price = safe_float(prices.iloc[index])
        gross_result = safe_float(results.iloc[index]) if results is not None else None
        fee_total = safe_float(fees.iloc[index]) if fees is not None else None

        if not ticker or not filled_at or quantity is None or price is None or quantity <= 0:
            continue

        long_inventory = long_inventory_by_ticker.setdefault(ticker, [])
        short_inventory = short_inventory_by_ticker.setdefault(ticker, [])

        is_buy = "buy" in action_lower
        is_sell = "sell" in action_lower

        if not is_buy and not is_sell:
            continue

        def append_open_lot(target_inventory: list[dict], prefix: str) -> None:
            target_inventory.append(
                {
                    "trade_id": trade_id or f"{prefix}:{ticker}:{index}",
                    "filled_at": filled_at,
                    "price": price,
                    "remaining_quantity": quantity,
                    "fee_total": fee_total or 0.0,
                }
            )

        def close_inventory(
            inventory: list[dict],
            side: str,
            close_prefix: str,
            remaining_to_match: float,
            match_index_start: int = 0,
        ) -> tuple[float, int]:
            match_index = match_index_start

            while remaining_to_match > 1e-9 and inventory:
                entry_lot = inventory[0]
                entry_remaining_before = entry_lot["remaining_quantity"]
                matched_quantity = min(entry_remaining_before, remaining_to_match)
                quantity_share = matched_quantity / quantity if quantity > 0 else 0
                allocated_entry_fee = (entry_lot["fee_total"] or 0.0) * (
                    matched_quantity / entry_remaining_before
                    if entry_remaining_before > 0
                    else 0
                )
                allocated_exit_fee = (fee_total or 0.0) * quantity_share
                fallback_profit = (
                    (price - entry_lot["price"]) * matched_quantity
                    if side == "LONG"
                    else (entry_lot["price"] - price) * matched_quantity
                )
                allocated_profit = (
                    gross_result * quantity_share if gross_result is not None else fallback_profit
                )

                closed_trades.append(
                    {
                        "entry_time": entry_lot["filled_at"],
                        "exit_time": filled_at,
                        "side": side,
                        "entry_price": float(entry_lot["price"]),
                        "exit_price": float(price),
                        "stop_loss": float(entry_lot["price"] * (0.98 if side == "LONG" else 1.02)),
                        "take_profit": float(entry_lot["price"] * (1.04 if side == "LONG" else 0.96)),
                        "trade_id": f"{trade_id or f'{close_prefix}:{ticker}:{index}'}:{entry_lot['trade_id']}:{match_index}",
                        "symbol": ticker,
                        "volume": float(matched_quantity),
                        "profit": round(allocated_profit, 6),
                        "commission": round(-(allocated_entry_fee + allocated_exit_fee), 6),
                        "swap": 0.0,
                    }
                )

                entry_lot["remaining_quantity"] -= matched_quantity
                entry_lot["fee_total"] = max(0.0, (entry_lot["fee_total"] or 0.0) - allocated_entry_fee)
                remaining_to_match -= matched_quantity
                match_index += 1

                if entry_lot["remaining_quantity"] <= 1e-9:
                    inventory.pop(0)

            return remaining_to_match, match_index

        if is_buy:
            if short_inventory:
                remaining_to_match, _ = close_inventory(short_inventory, "SHORT", "buy", quantity)
                if remaining_to_match > 1e-9:
                    target_fee = (fee_total or 0.0) * (remaining_to_match / quantity) if quantity > 0 else 0.0
                    quantity = remaining_to_match
                    fee_total = target_fee
                    append_open_lot(long_inventory, "buy")
            else:
                append_open_lot(long_inventory, "buy")
            continue

        remaining_to_match, _ = close_inventory(long_inventory, "LONG", "sell", quantity)
        if remaining_to_match > 1e-9:
            target_fee = (fee_total or 0.0) * (remaining_to_match / quantity) if quantity > 0 else 0.0
            quantity = remaining_to_match
            fee_total = target_fee
            append_open_lot(short_inventory, "sell")

    return closed_trades


def map_csv_columns(df: pd.DataFrame) -> list[dict]:
    if is_trading212_history_csv(df):
        return map_trading212_history_csv(df)

    col_lower = {normalize_csv_column_name(c): c for c in df.columns}

    def find(*candidates):
        for candidate in candidates:
            if candidate in col_lower:
                return df[col_lower[candidate]]
        return None

    entry_time = find("entry_time", "entrytime", "entry_date", "entrydate", "open_time", "opentime", "open_date", "opendate")
    exit_time = find("exit_time", "exittime", "exit_date", "exitdate", "close_time", "closetime", "close_date", "closedate")
    entry_price = find("entry_price", "entryprice", "open_price", "openprice", "buyprice", "buy_price")
    exit_price = find("exit_price", "exitprice", "close_price", "closeprice", "sellprice", "sell_price")
    symbol_col = find("symbol", "ticker", "instrument", "pair", "asset")
    trade_id_col = find("trade_id", "ticket", "id", "order_id")
    side_col = find("side", "direction", "type", "trade_type")
    sl_col = find("stop_loss", "stoploss", "sl")
    tp_col = find("take_profit", "takeprofit", "tp")
    volume_col = find("volume", "lot_size", "lots", "position_size", "size")
    profit_col = find("profit", "pnl", "net_pnl", "realized_pnl", "realised_pnl")
    commission_col = find("commission", "fees", "fee")
    swap_col = find("swap", "financing", "rollover")
    mfe_col = find("mfe", "max_favorable_excursion", "maximum_favorable_excursion")
    mae_col = find("mae", "max_adverse_excursion", "maximum_adverse_excursion")
    entry_time_local_col = find("entry_time_local", "local_entry_time")
    exit_time_local_col = find("exit_time_local", "local_exit_time")

    missing = []
    if entry_time is None:
        missing.append("entry_time/entry_date")
    if exit_time is None:
        missing.append("exit_time/exit_date")
    if entry_price is None:
        missing.append("entry_price")
    if exit_price is None:
        missing.append("exit_price")
    if missing:
        raise ValueError(f"CSV missing required columns: {missing}")

    ep = pd.to_numeric(entry_price, errors="coerce")
    xp = pd.to_numeric(exit_price, errors="coerce")
    sl_numeric = pd.to_numeric(sl_col, errors="coerce") if sl_col is not None else None
    tp_numeric = pd.to_numeric(tp_col, errors="coerce") if tp_col is not None else None

    def fmt(val: str) -> str:
        v = str(val).strip()
        return v + " 09:00:00" if len(v) <= 10 and "T" not in v and " " not in v else v

    trades = []
    ambiguous_side_rows: list[int] = []
    for i in range(len(df)):
        try:
            entry_price_value = float(ep.iloc[i])
            exit_price_value = float(xp.iloc[i])
            stop_loss_value = (
                float(sl_numeric.iloc[i]) if sl_numeric is not None and pd.notna(sl_numeric.iloc[i]) else None
            )
            take_profit_value = (
                float(tp_numeric.iloc[i]) if tp_numeric is not None and pd.notna(tp_numeric.iloc[i]) else None
            )

            side_value = normalize_trade_side(side_col.iloc[i]) if side_col is not None else None
            if side_value is None:
                side_value = infer_trade_side(
                    entry_price=entry_price_value,
                    stop_loss=stop_loss_value,
                    take_profit=take_profit_value,
                )

            if side_value is None:
                ambiguous_side_rows.append(i + 2)
                continue

            if stop_loss_value is None:
                stop_loss_value = entry_price_value * (0.98 if side_value == "LONG" else 1.02)
            if take_profit_value is None:
                take_profit_value = entry_price_value * (1.04 if side_value == "LONG" else 0.96)

            trades.append(
                {
                    "entry_time": fmt(str(entry_time.iloc[i])),
                    "exit_time": fmt(str(exit_time.iloc[i])),
                    "entry_time_local": fmt(str(entry_time_local_col.iloc[i])) if entry_time_local_col is not None and pd.notna(entry_time_local_col.iloc[i]) else None,
                    "exit_time_local": fmt(str(exit_time_local_col.iloc[i])) if exit_time_local_col is not None and pd.notna(exit_time_local_col.iloc[i]) else None,
                    "side": side_value,
                    "entry_price": entry_price_value,
                    "exit_price": exit_price_value,
                    "stop_loss": stop_loss_value,
                    "take_profit": take_profit_value,
                    "trade_id": str(trade_id_col.iloc[i]) if trade_id_col is not None else None,
                    "symbol": str(symbol_col.iloc[i]) if symbol_col is not None else None,
                    "volume": float(pd.to_numeric(volume_col.iloc[i], errors="coerce")) if volume_col is not None and pd.notna(pd.to_numeric(volume_col.iloc[i], errors="coerce")) else None,
                    "profit": float(pd.to_numeric(profit_col.iloc[i], errors="coerce")) if profit_col is not None and pd.notna(pd.to_numeric(profit_col.iloc[i], errors="coerce")) else None,
                    "commission": float(pd.to_numeric(commission_col.iloc[i], errors="coerce")) if commission_col is not None and pd.notna(pd.to_numeric(commission_col.iloc[i], errors="coerce")) else None,
                    "swap": float(pd.to_numeric(swap_col.iloc[i], errors="coerce")) if swap_col is not None and pd.notna(pd.to_numeric(swap_col.iloc[i], errors="coerce")) else None,
                    "mfe": float(pd.to_numeric(mfe_col.iloc[i], errors="coerce")) if mfe_col is not None and pd.notna(pd.to_numeric(mfe_col.iloc[i], errors="coerce")) else None,
                    "mae": float(pd.to_numeric(mae_col.iloc[i], errors="coerce")) if mae_col is not None and pd.notna(pd.to_numeric(mae_col.iloc[i], errors="coerce")) else None,
                }
            )
        except Exception:
            continue

    if ambiguous_side_rows:
        preview = ", ".join(str(row) for row in ambiguous_side_rows[:5])
        more = "" if len(ambiguous_side_rows) <= 5 else f" and {len(ambiguous_side_rows) - 5} more"
        raise ValueError(
            "CSV is missing a usable trade direction for some rows. "
            f"Add a side/direction column or consistent stop-loss/take-profit levels. "
            f"Ambiguous rows: {preview}{more}."
        )

    return trades
