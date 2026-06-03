import { describe, expect, it, vi } from "vitest";
import { PriceOscillationBot } from "../src/bot.js";
import type { AlertStore, Logger, TickerClient } from "../src/types.js";

function createLogger(): Logger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe("PriceOscillationBot", () => {
  it("sets initial rate without creating an alert", async () => {
    const tickerClient: TickerClient = {
      getTicker: vi.fn().mockResolvedValue({
        pair: "BTC-USD",
        rate: 100,
        raw: {},
        timestamp: new Date().toISOString(),
      }),
    };

    const alertStore: AlertStore = {
      save: vi.fn(),
    };

    const bot = new PriceOscillationBot({
      pairs: ["BTC-USD"],
      intervalMs: 5000,
      thresholdPercentage: 0.01,
      tickerClient,
      alertStores: [alertStore],
      logger: createLogger(),
    });

    await bot.checkPair("BTC-USD");

    expect(alertStore.save).not.toHaveBeenCalled();
  });

  it("creates an alert when threshold is reached upward", async () => {
    const tickerClient: TickerClient = {
      getTicker: vi
        .fn()
        .mockResolvedValueOnce({
          pair: "BTC-USD",
          rate: 100,
          raw: {},
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          pair: "BTC-USD",
          rate: 100.01,
          raw: {},
          timestamp: new Date().toISOString(),
        }),
    };

    const alertStore: AlertStore = {
      save: vi.fn(),
    };

    const bot = new PriceOscillationBot({
      pairs: ["BTC-USD"],
      intervalMs: 5000,
      thresholdPercentage: 0.01,
      tickerClient,
      alertStores: [alertStore],
      logger: createLogger(),
    });

    await bot.checkPair("BTC-USD");
    await bot.checkPair("BTC-USD");

    expect(alertStore.save).toHaveBeenCalledTimes(1);
  });

  it("creates an alert when threshold is reached downward", async () => {
    const tickerClient: TickerClient = {
      getTicker: vi
        .fn()
        .mockResolvedValueOnce({
          pair: "BTC-USD",
          rate: 100,
          raw: {},
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          pair: "BTC-USD",
          rate: 99.99,
          raw: {},
          timestamp: new Date().toISOString(),
        }),
    };

    const alertStore: AlertStore = {
      save: vi.fn(),
    };

    const bot = new PriceOscillationBot({
      pairs: ["BTC-USD"],
      intervalMs: 5000,
      thresholdPercentage: 0.01,
      tickerClient,
      alertStores: [alertStore],
      logger: createLogger(),
    });

    await bot.checkPair("BTC-USD");
    await bot.checkPair("BTC-USD");

    expect(alertStore.save).toHaveBeenCalledTimes(1);
  });

  it("does not create alert below threshold", async () => {
    const tickerClient: TickerClient = {
      getTicker: vi
        .fn()
        .mockResolvedValueOnce({
          pair: "BTC-USD",
          rate: 100,
          raw: {},
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          pair: "BTC-USD",
          rate: 100.005,
          raw: {},
          timestamp: new Date().toISOString(),
        }),
    };

    const alertStore: AlertStore = {
      save: vi.fn(),
    };

    const bot = new PriceOscillationBot({
      pairs: ["BTC-USD"],
      intervalMs: 5000,
      thresholdPercentage: 0.01,
      tickerClient,
      alertStores: [alertStore],
      logger: createLogger(),
    });

    await bot.checkPair("BTC-USD");
    await bot.checkPair("BTC-USD");

    expect(alertStore.save).not.toHaveBeenCalled();
  });

  it("advances baseline when at least one alert store succeeds", async () => {
    const tickerClient: TickerClient = {
      getTicker: vi
        .fn()
        .mockResolvedValueOnce({
          pair: "BTC-USD",
          rate: 100,
          raw: {},
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          pair: "BTC-USD",
          rate: 101,
          raw: {},
          timestamp: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          pair: "BTC-USD",
          rate: 101.005,
          raw: {},
          timestamp: new Date().toISOString(),
        }),
    };

    const successfulStore: AlertStore = {
      save: vi.fn().mockResolvedValue(undefined),
    };

    const failingStore: AlertStore = {
      save: vi.fn().mockRejectedValue(new Error("store unavailable")),
    };

    const bot = new PriceOscillationBot({
      pairs: ["BTC-USD"],
      intervalMs: 5000,
      thresholdPercentage: 0.5,
      tickerClient,
      alertStores: [successfulStore, failingStore],
      logger: createLogger(),
    });

    await bot.checkPair("BTC-USD");
    await bot.checkPair("BTC-USD");
    await bot.checkPair("BTC-USD");

    expect(successfulStore.save).toHaveBeenCalledTimes(1);
    expect(failingStore.save).toHaveBeenCalledTimes(1);
  });
});
