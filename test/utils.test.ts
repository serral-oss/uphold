import { describe, expect, it } from "vitest";
import { calculatePercentageChange, normalizePairs, shouldTriggerAlert } from "../src/utils.js";

describe("normalizePairs", () => {
  it("normalizes comma-separated pairs", () => {
    expect(normalizePairs("btc-usd, eth-eur ,xrp-usd")).toEqual(["BTC-USD", "ETH-EUR", "XRP-USD"]);
  });

  it("filters empty values", () => {
    expect(normalizePairs("BTC-USD,, ,ETH-USD")).toEqual(["BTC-USD", "ETH-USD"]);
  });
});

describe("calculatePercentageChange", () => {
  it("calculates positive percentage changes", () => {
    expect(calculatePercentageChange(100, 101)).toBe(1);
  });

  it("calculates negative percentage changes", () => {
    expect(calculatePercentageChange(100, 99)).toBe(-1);
  });

  it("throws for invalid previous rate", () => {
    expect(() => calculatePercentageChange(0, 100)).toThrow();
  });
});

describe("shouldTriggerAlert", () => {
  it("returns true when increase reaches threshold", () => {
    expect(
      shouldTriggerAlert({
        previousRate: 100,
        currentRate: 100.01,
        thresholdPercentage: 0.01,
      }),
    ).toBe(true);
  });

  it("returns true when decrease reaches threshold", () => {
    expect(
      shouldTriggerAlert({
        previousRate: 100,
        currentRate: 99.99,
        thresholdPercentage: 0.01,
      }),
    ).toBe(true);
  });

  it("returns false below threshold", () => {
    expect(
      shouldTriggerAlert({
        previousRate: 100,
        currentRate: 100.005,
        thresholdPercentage: 0.01,
      }),
    ).toBe(false);
  });
});
