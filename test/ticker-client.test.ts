import { describe, expect, it, vi } from "vitest";
import { UpholdTickerClient } from "../src/ticker-client.js";

describe("UpholdTickerClient", () => {
  it("uses midpoint when bid and ask are present", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        bid: "100",
        ask: "102",
      }),
    });

    const client = new UpholdTickerClient({
      fetchImplementation,
      baseUrl: "https://api.uphold.com",
      timeoutMs: 1000,
    });

    const result = await client.getTicker("BTC-USD");

    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://api.uphold.com/v0/ticker/BTC-USD",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.rate).toBe(101);
    expect(result.pair).toBe("BTC-USD");
  });

  it("throws on non-2xx responses", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("internal error"),
    });

    const client = new UpholdTickerClient({
      fetchImplementation,
    });

    await expect(client.getTicker("BTC-USD")).rejects.toThrow(
      "Uphold API request failed with status 500: internal error",
    );
  });

  it("throws when response has neither bid nor ask", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        foo: "bar",
      }),
    });

    const client = new UpholdTickerClient({
      fetchImplementation,
    });

    await expect(client.getTicker("BTC-USD")).rejects.toThrow(
      "Ticker response does not contain a valid bid or ask rate.",
    );
  });
});
