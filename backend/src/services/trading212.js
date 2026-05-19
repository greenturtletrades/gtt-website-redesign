function buildTrading212TradesFromHistory(historicalOrders) {
  if (!Array.isArray(historicalOrders) || historicalOrders.length === 0) {
    return [];
  }

  const fills = historicalOrders
    .map((item, index) => {
      const order = item?.order && typeof item.order === "object" ? item.order : {};
      const fill = item?.fill && typeof item.fill === "object" ? item.fill : {};
      const side = typeof order.side === "string" ? order.side.toUpperCase() : "";
      const ticker =
        typeof order.ticker === "string" && order.ticker.trim()
          ? order.ticker.trim()
          : typeof order.instrument?.ticker === "string" && order.instrument.ticker.trim()
            ? order.instrument.ticker.trim()
            : "";
      const quantity = Math.abs(Number(fill.quantity ?? order.filledQuantity ?? order.quantity ?? 0));
      const price = Number(fill.price);
      const filledAt = typeof fill.filledAt === "string" ? fill.filledAt : order.createdAt;

      if (!side || !ticker || !(quantity > 0) || !Number.isFinite(price) || !filledAt) {
        return null;
      }

      const taxTotal = Array.isArray(fill.walletImpact?.taxes)
        ? fill.walletImpact.taxes.reduce((sum, tax) => sum + (Number(tax?.quantity) || 0), 0)
        : 0;

      return {
        orderId: String(order.id ?? index),
        fillId: String(fill.id ?? index),
        side,
        ticker,
        quantity,
        price,
        filledAt,
        realisedProfitLoss:
          typeof fill.walletImpact?.realisedProfitLoss === "number"
            ? fill.walletImpact.realisedProfitLoss
            : null,
        taxTotal,
      };
    })
    .filter(Boolean)
    .sort((left, right) => (Date.parse(left.filledAt) || 0) - (Date.parse(right.filledAt) || 0));

  const longInventoryByTicker = new Map();
  const shortInventoryByTicker = new Map();
  const closedTrades = [];

  for (const fill of fills) {
    const longInventory = longInventoryByTicker.get(fill.ticker) || [];
    const shortInventory = shortInventoryByTicker.get(fill.ticker) || [];

    function closeInventory(inventory, side, remainingToMatch, matchIndexStart = 0) {
      let matchIndex = matchIndexStart;

      while (remainingToMatch > 1e-9 && inventory.length > 0) {
        const entryLot = inventory[0];
        const entryRemainingBefore = entryLot.remainingQuantity;
        const matchedQuantity = Math.min(entryRemainingBefore, remainingToMatch);
        const quantityShare = matchedQuantity / fill.quantity;
        const allocatedEntryFee =
          (entryLot.feeTotal || 0) * (entryRemainingBefore > 0 ? matchedQuantity / entryRemainingBefore : 0);
        const allocatedExitFee = (fill.taxTotal || 0) * quantityShare;
        const fallbackProfit =
          side === "LONG"
            ? (fill.price - entryLot.price) * matchedQuantity
            : (entryLot.price - fill.price) * matchedQuantity;
        const allocatedProfit =
          typeof fill.realisedProfitLoss === "number"
            ? fill.realisedProfitLoss * quantityShare
            : fallbackProfit;

        closedTrades.push({
          trade_id: `${fill.orderId}:${entryLot.fillId}:${matchIndex}`,
          symbol: fill.ticker,
          side,
          entry_time: entryLot.filledAt,
          exit_time: fill.filledAt,
          entry_price: entryLot.price,
          exit_price: fill.price,
          stop_loss: side === "LONG" ? entryLot.price * 0.98 : entryLot.price * 1.02,
          take_profit: side === "LONG" ? entryLot.price * 1.04 : entryLot.price * 0.96,
          volume: matchedQuantity,
          profit: Number(allocatedProfit.toFixed(6)),
          commission: Number((-(allocatedEntryFee + allocatedExitFee)).toFixed(6)),
          swap: 0,
          mfe: null,
          mae: null,
          raw_source: "trading212_api",
        });

        entryLot.remainingQuantity -= matchedQuantity;
        entryLot.feeTotal = Math.max(0, (entryLot.feeTotal || 0) - allocatedEntryFee);
        remainingToMatch -= matchedQuantity;
        matchIndex += 1;

        if (entryLot.remainingQuantity <= 1e-9) {
          inventory.shift();
        }
      }

      return remainingToMatch;
    }

    if (fill.side === "BUY") {
      let remainingToMatch = fill.quantity;
      if (shortInventory.length > 0) {
        remainingToMatch = closeInventory(shortInventory, "SHORT", remainingToMatch);
      }

      if (remainingToMatch > 1e-9) {
        const feeShare = (fill.taxTotal || 0) * (remainingToMatch / fill.quantity);
        longInventory.push({
          fillId: fill.fillId,
          filledAt: fill.filledAt,
          price: fill.price,
          remainingQuantity: remainingToMatch,
          feeTotal: feeShare,
        });
      }

      longInventoryByTicker.set(fill.ticker, longInventory);
      shortInventoryByTicker.set(fill.ticker, shortInventory);
      continue;
    }

    if (fill.side !== "SELL") {
      continue;
    }

    let remainingToMatch = fill.quantity;
    if (longInventory.length > 0) {
      remainingToMatch = closeInventory(longInventory, "LONG", remainingToMatch);
    }

    if (remainingToMatch > 1e-9) {
      const feeShare = (fill.taxTotal || 0) * (remainingToMatch / fill.quantity);
      shortInventory.push({
        fillId: fill.fillId,
        filledAt: fill.filledAt,
        price: fill.price,
        remainingQuantity: remainingToMatch,
        feeTotal: feeShare,
      });
    }

    longInventoryByTicker.set(fill.ticker, longInventory);
    shortInventoryByTicker.set(fill.ticker, shortInventory);
  }

  return closedTrades;
}

module.exports = {
  buildTrading212TradesFromHistory,
};
