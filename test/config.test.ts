import { describe, expect, it } from "vitest";
import { parseConfig } from "../src/config.js";

describe("parseConfig", () => {
  it("uses defaults", () => {
    const config = parseConfig([]);

    expect(config.pairs).toEqual(["BTC-USD"]);
    expect(config.intervalMs).toBe(5000);
    expect(config.thresholdPercentage).toBe(0.01);
  });

  it("parses CLI arguments", () => {
    const config = parseConfig([
      "--pairs",
      "BTC-USD,ETH-USD",
      "--interval",
      "1000",
      "--threshold",
      "0.5",
    ]);

    expect(config.pairs).toEqual(["BTC-USD", "ETH-USD"]);
    expect(config.intervalMs).toBe(1000);
    expect(config.thresholdPercentage).toBe(0.5);
  });

  it("throws for invalid interval", () => {
    expect(() => parseConfig(["--interval", "0"])).toThrow();
  });

  it("throws for invalid threshold", () => {
    expect(() => parseConfig(["--threshold", "-1"])).toThrow();
  });
});
