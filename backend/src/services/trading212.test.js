const test = require("node:test");
const assert = require("node:assert/strict");

const { buildTrading212TradesFromHistory } = require("./trading212");

test("buildTrading212TradesFromHistory supports short Trading 212 positions", () => {
  const trades = buildTrading212TradesFromHistory([
    {
      order: {
        id: "sell-open",
        side: "SELL",
        ticker: "TSLA",
      },
      fill: {
        id: "fill-sell-open",
        quantity: 2,
        price: 300,
        filledAt: "2026-02-10T10:00:00.000Z",
        walletImpact: {
          taxes: [{ quantity: 0.5 }],
        },
      },
    },
    {
      order: {
        id: "buy-close",
        side: "BUY",
        ticker: "TSLA",
      },
      fill: {
        id: "fill-buy-close",
        quantity: 2,
        price: 270,
        filledAt: "2026-02-12T15:30:00.000Z",
        walletImpact: {
          realisedProfitLoss: 60,
          taxes: [{ quantity: 0.4 }],
        },
      },
    },
  ]);

  assert.equal(trades.length, 1);
  assert.equal(trades[0].side, "SHORT");
  assert.equal(trades[0].symbol, "TSLA");
  assert.equal(trades[0].entry_price, 300);
  assert.equal(trades[0].exit_price, 270);
  assert.equal(trades[0].profit, 60);
  assert.equal(trades[0].commission, -0.9);
});

test("buildTrading212TradesFromHistory can close a short then open a long", () => {
  const trades = buildTrading212TradesFromHistory([
    {
      order: {
        id: "sell-open",
        side: "SELL",
        ticker: "NVDA",
      },
      fill: {
        id: "fill-sell-open",
        quantity: 1,
        price: 120,
        filledAt: "2026-03-01T09:00:00.000Z",
        walletImpact: {
          taxes: [{ quantity: 0.2 }],
        },
      },
    },
    {
      order: {
        id: "buy-mixed",
        side: "BUY",
        ticker: "NVDA",
      },
      fill: {
        id: "fill-buy-mixed",
        quantity: 2,
        price: 100,
        filledAt: "2026-03-02T09:00:00.000Z",
        walletImpact: {
          realisedProfitLoss: 20,
          taxes: [{ quantity: 0.3 }],
        },
      },
    },
    {
      order: {
        id: "sell-close-long",
        side: "SELL",
        ticker: "NVDA",
      },
      fill: {
        id: "fill-sell-close-long",
        quantity: 1,
        price: 110,
        filledAt: "2026-03-03T09:00:00.000Z",
        walletImpact: {
          realisedProfitLoss: 10,
          taxes: [{ quantity: 0.1 }],
        },
      },
    },
  ]);

  assert.equal(trades.length, 2);
  assert.equal(trades[0].side, "SHORT");
  assert.equal(trades[0].volume, 1);
  assert.equal(trades[1].side, "LONG");
  assert.equal(trades[1].volume, 1);
  assert.equal(trades[1].entry_price, 100);
  assert.equal(trades[1].exit_price, 110);
});
