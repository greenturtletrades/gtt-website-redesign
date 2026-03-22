"""
MetaTrader 5 data loader for Turtle Analytics.

This module provides functions to connect to MetaTrader 5 and extract
trade history in a format compatible with the Turtle Analytics pipeline.
"""

import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import pandas as pd

try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    MT5_AVAILABLE = False
    logging.warning(
        "MetaTrader5 library not installed. "
        "Install with: pip install MetaTrader5"
    )

logger = logging.getLogger(__name__)


def connect_mt5(
    login: Optional[int] = None,
    password: Optional[str] = None,
    server: Optional[str] = None,
    path: Optional[str] = None,
    timeout: int = 60000
) -> bool:
    """
    Connect to MetaTrader 5 terminal.

    Parameters
    ----------
    login : int, optional
        Trading account number. If None, uses the current account.
    password : str, optional
        Trading account password.
    server : str, optional
        Broker server name.
    path : str, optional
        Path to MT5 terminal.exe. If None, auto-detects.
    timeout : int, default 60000
        Connection timeout in milliseconds.

    Returns
    -------
    bool
        True if connection successful, False otherwise.

    Examples
    --------
    >>> connect_mt5(login=12345678, password="mypass", server="Broker-Demo")
    >>> connect_mt5()  # Use currently logged in account
    """
    if not MT5_AVAILABLE:
        raise ImportError(
            "MetaTrader5 library not installed. "
            "Install with: pip install MetaTrader5"
        )

    # Initialize MT5 connection
    if path:
        if not mt5.initialize(path=path, timeout=timeout):
            logger.error(f"MT5 initialize() failed: {mt5.last_error()}")
            return False
    else:
        if not mt5.initialize(timeout=timeout):
            logger.error(f"MT5 initialize() failed: {mt5.last_error()}")
            return False

    logger.info("MT5 initialized successfully")

    # Login if credentials provided
    if login and password and server:
        if not mt5.login(login=login, password=password, server=server):
            logger.error(f"MT5 login failed: {mt5.last_error()}")
            mt5.shutdown()
            return False
        logger.info(f"Logged in to account {login} on {server}")
    else:
        # Use current account
        account_info = mt5.account_info()
        if account_info is None:
            logger.error("No account logged in")
            mt5.shutdown()
            return False
        logger.info(f"Using current account: {account_info.login}")

    return True


def disconnect_mt5() -> None:
    """Disconnect from MetaTrader 5 terminal."""
    if MT5_AVAILABLE:
        mt5.shutdown()
        logger.info("MT5 connection closed")


def fetch_mt5_positions(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    symbol: Optional[str] = None,
    group: str = "*"
) -> pd.DataFrame:
    """
    Fetch closed positions from MetaTrader 5.

    MT5 uses deals to represent individual trades. A position consists of
    an entry deal and an exit deal. This function reconstructs complete
    positions from the deal history.

    Parameters
    ----------
    date_from : datetime, optional
        Start date for history query. Default is 90 days ago.
    date_to : datetime, optional
        End date for history query. Default is now.
    symbol : str, optional
        Filter by specific symbol (e.g., "EURUSD"). Default is all symbols.
    group : str, default "*"
        Filter by symbol group pattern (e.g., "Forex\\*").

    Returns
    -------
    pd.DataFrame
        DataFrame with columns:
        - position_id: Unique position identifier
        - entry_time: Position open time
        - exit_time: Position close time
        - side: "LONG" or "SHORT"
        - entry_price: Entry price
        - exit_price: Exit price
        - volume: Trade volume (lots)
        - symbol: Trading symbol
        - profit: Realized profit/loss
        - commission: Total commission
        - swap: Swap/rollover
        - entry_deal: Entry deal ticket
        - exit_deal: Exit deal ticket

    Examples
    --------
    >>> df = fetch_mt5_positions(date_from=datetime(2024, 1, 1))
    >>> df = fetch_mt5_positions(symbol="EURUSD")
    """
    if not MT5_AVAILABLE:
        raise ImportError("MetaTrader5 library not installed")

    # Set default date range
    if date_to is None:
        date_to = datetime.now()
    if date_from is None:
        date_from = date_to - timedelta(days=90)

    logger.info(f"Fetching deals from {date_from} to {date_to}")

    # Fetch all deals in the date range
    deals = mt5.history_deals_get(date_from, date_to, group=group)

    if deals is None:
        logger.error(f"Failed to fetch deals: {mt5.last_error()}")
        return pd.DataFrame()

    if len(deals) == 0:
        logger.warning("No deals found in the specified range")
        return pd.DataFrame()

    # Convert to DataFrame
    df_deals = pd.DataFrame(list(deals), columns=deals[0]._asdict().keys())

    # Filter by symbol if specified
    if symbol:
        df_deals = df_deals[df_deals['symbol'] == symbol].copy()

    # Filter only position entry/exit deals (type 0=buy, 1=sell)
    # Exclude balance operations, credits, etc.
    df_deals = df_deals[df_deals['entry'].isin([0, 1, 2])].copy()

    # Convert timestamps
    df_deals['time'] = pd.to_datetime(df_deals['time'], unit='s')

    logger.info(f"Found {len(df_deals)} deals")

    # Group deals by position_id to reconstruct complete positions
    positions = []

    for position_id, group_df in df_deals.groupby('position_id'):
        if position_id == 0:
            # Skip deals not associated with a position
            continue

        # Sort by time
        group_df = group_df.sort_values('time')

        # MT5 entry types: 0=IN, 1=OUT, 2=INOUT
        entry_deals = group_df[group_df['entry'].isin([0, 2])]
        exit_deals = group_df[group_df['entry'].isin([1, 2])]

        if len(entry_deals) == 0 or len(exit_deals) == 0:
            # Position not closed yet
            continue

        # Take first entry and last exit
        entry = entry_deals.iloc[0]
        exit = exit_deals.iloc[-1]

        # Determine side (0=buy/LONG, 1=sell/SHORT)
        side = "LONG" if entry['type'] == 0 else "SHORT"

        position = {
            'position_id': int(position_id),
            'entry_time': entry['time'],
            'exit_time': exit['time'],
            'side': side,
            'entry_price': float(entry['price']),
            'exit_price': float(exit['price']),
            'volume': float(entry['volume']),
            'symbol': str(entry['symbol']),
            'profit': float(group_df['profit'].sum()),
            'commission': float(group_df['commission'].sum()),
            'swap': float(group_df['swap'].sum()),
            'entry_deal': int(entry['ticket']),
            'exit_deal': int(exit['ticket']),
        }

        positions.append(position)

    logger.info(f"Reconstructed {len(positions)} closed positions")

    return pd.DataFrame(positions)


def calculate_sl_tp_from_orders(
    position_df: pd.DataFrame,
    date_from: datetime,
    date_to: datetime
) -> pd.DataFrame:
    """
    Enhance position data with stop loss and take profit from orders.

    This function queries MT5 order history to find the original SL/TP
    levels associated with each position.

    Parameters
    ----------
    position_df : pd.DataFrame
        DataFrame from fetch_mt5_positions()
    date_from : datetime
        Start date for order history
    date_to : datetime
        End date for order history

    Returns
    -------
    pd.DataFrame
        Position DataFrame with added columns:
        - stop_loss: SL price level
        - take_profit: TP price level
    """
    if not MT5_AVAILABLE or len(position_df) == 0:
        return position_df

    logger.info("Fetching order history for SL/TP data")

    # Fetch orders
    orders = mt5.history_orders_get(date_from, date_to)

    if orders is None or len(orders) == 0:
        logger.warning("No orders found - cannot retrieve SL/TP")
        return position_df

    df_orders = pd.DataFrame(list(orders), columns=orders[0]._asdict().keys())

    # Create mapping of position_id -> (sl, tp)
    sl_tp_map = {}

    for position_id, group in df_orders.groupby('position_id'):
        if position_id == 0:
            continue

        # Find the entry order (type 0=buy, 1=sell)
        entry_orders = group[group['type'].isin([0, 1])]

        if len(entry_orders) > 0:
            order = entry_orders.iloc[0]
            sl = order.get('sl', 0.0)
            tp = order.get('tp', 0.0)
            sl_tp_map[position_id] = (sl, tp)

    # Map to position DataFrame
    position_df['stop_loss'] = position_df['position_id'].map(
        lambda pid: sl_tp_map.get(pid, (0.0, 0.0))[0]
    )
    position_df['take_profit'] = position_df['position_id'].map(
        lambda pid: sl_tp_map.get(pid, (0.0, 0.0))[1]
    )

    logger.info(f"Added SL/TP for {len(sl_tp_map)} positions")

    return position_df


def transform_to_turtle_schema(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transform MT5 position data to Turtle Analytics schema.

    Maps MT5 fields to the required schema expected by the analytics pipeline.

    Required output columns:
    - entry_time, exit_time, side, entry_price, exit_price, stop_loss, take_profit

    Optional output columns:
    - symbol, mfe, mae, session, spread, volatility

    Parameters
    ----------
    df : pd.DataFrame
        DataFrame from fetch_mt5_positions() with SL/TP added

    Returns
    -------
    pd.DataFrame
        Transformed DataFrame ready for validate_trades()
    """
    if len(df) == 0:
        return pd.DataFrame()

    # Validate required MT5 columns
    required = ['entry_time', 'exit_time', 'side', 'entry_price', 'exit_price']
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Start with required columns
    turtle_df = df[[
        'entry_time', 'exit_time', 'side',
        'entry_price', 'exit_price'
    ]].copy()

    # Add stop_loss and take_profit (required by schema)
    if 'stop_loss' in df.columns:
        turtle_df['stop_loss'] = df['stop_loss']
    else:
        # Estimate SL if not available (use 2% default risk)
        turtle_df['stop_loss'] = df.apply(
            lambda row: row['entry_price'] * (0.98 if row['side'] == 'LONG' else 1.02),
            axis=1
        )
        logger.warning("stop_loss not available - estimated at 2% risk")

    if 'take_profit' in df.columns:
        turtle_df['take_profit'] = df['take_profit']
    else:
        # Estimate TP if not available (use 2:1 RR)
        turtle_df['take_profit'] = df.apply(
            lambda row: row['entry_price'] * (1.04 if row['side'] == 'LONG' else 0.96),
            axis=1
        )
        logger.warning("take_profit not available - estimated at 2:1 RR")

    # Add optional columns if available
    if 'symbol' in df.columns:
        turtle_df['symbol'] = df['symbol']

    if 'mfe' in df.columns:
        turtle_df['mfe'] = df['mfe']

    if 'mae' in df.columns:
        turtle_df['mae'] = df['mae']

    # Classify trading session based on entry time (UTC)
    if 'entry_time' in turtle_df.columns:
        turtle_df['session'] = turtle_df['entry_time'].apply(classify_session)

    logger.info(f"Transformed {len(turtle_df)} positions to Turtle schema")

    return turtle_df


def classify_session(timestamp: pd.Timestamp) -> str:
    """
    Classify trading session based on UTC hour.

    Sessions:
    - asian: 00:00-08:00 UTC
    - london: 08:00-12:00 UTC
    - ny: 12:00-20:00 UTC
    - overnight: 20:00-00:00 UTC
    """
    hour = timestamp.hour

    if 0 <= hour < 8:
        return 'asian'
    elif 8 <= hour < 12:
        return 'london'
    elif 12 <= hour < 20:
        return 'ny'
    else:
        return 'overnight'


def load_trades_from_mt5(
    login: Optional[int] = None,
    password: Optional[str] = None,
    server: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    symbol: Optional[str] = None,
    calculate_mfe_mae: bool = False
) -> pd.DataFrame:
    """
    Main entry point: Load trades from MT5 in Turtle Analytics format.

    This function:
    1. Connects to MT5
    2. Fetches position history
    3. Retrieves SL/TP from orders
    4. Optionally calculates MFE/MAE
    5. Transforms to Turtle schema
    6. Disconnects from MT5

    Parameters
    ----------
    login : int, optional
        MT5 account number
    password : str, optional
        MT5 account password
    server : str, optional
        Broker server name
    date_from : datetime, optional
        Start date (default: 90 days ago)
    date_to : datetime, optional
        End date (default: now)
    symbol : str, optional
        Filter by symbol
    calculate_mfe_mae : bool, default False
        Whether to calculate MFE/MAE from tick data (slow for large datasets)

    Returns
    -------
    pd.DataFrame
        Trade data in Turtle Analytics schema, ready for validate_trades()

    Examples
    --------
    >>> df = load_trades_from_mt5(
    ...     login=12345678,
    ...     password="mypass",
    ...     server="Broker-Demo",
    ...     date_from=datetime(2024, 1, 1)
    ... )
    >>> # Or use current account:
    >>> df = load_trades_from_mt5()
    """
    try:
        # Connect to MT5
        if not connect_mt5(login=login, password=password, server=server):
            raise RuntimeError("Failed to connect to MetaTrader 5")

        # Fetch positions
        df_positions = fetch_mt5_positions(
            date_from=date_from,
            date_to=date_to,
            symbol=symbol
        )

        if len(df_positions) == 0:
            logger.warning("No positions found")
            return pd.DataFrame()

        # Add SL/TP from orders
        date_from_actual = date_from or (datetime.now() - timedelta(days=90))
        date_to_actual = date_to or datetime.now()

        df_positions = calculate_sl_tp_from_orders(
            df_positions,
            date_from_actual,
            date_to_actual
        )

        # Calculate MFE/MAE if requested (computationally expensive)
        if calculate_mfe_mae:
            logger.info("MFE/MAE calculation not yet implemented")
            # TODO: Implement tick-by-tick analysis
            # Would require: mt5.copy_ticks_range() for each position

        # Transform to Turtle schema
        df_turtle = transform_to_turtle_schema(df_positions)

        return df_turtle

    finally:
        # Always disconnect
        disconnect_mt5()


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)

    # Load trades from MT5
    df = load_trades_from_mt5(
        date_from=datetime(2024, 1, 1),
        date_to=datetime.now()
    )

    print(f"Loaded {len(df)} trades from MetaTrader 5")
    print(df.head())
