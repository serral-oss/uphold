import type { CurrencyPair, TickerResult } from "./types.js";

interface UpholdTickerClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
}

interface UpholdTickerResponse {
  bid?: string | number;
  ask?: string | number;
  [key: string]: unknown;
}

export class UpholdTickerClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImplementation: typeof fetch;

  constructor({
    baseUrl = "https://api.uphold.com",
    timeoutMs = 10000,
    fetchImplementation = globalThis.fetch,
  }: UpholdTickerClientOptions = {}) {
    if (!fetchImplementation) {
      throw new Error("No fetch implementation available.");
    }

    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
    this.fetchImplementation = fetchImplementation;
  }

  async getTicker(pair: CurrencyPair): Promise<TickerResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const url = `${this.baseUrl}/v0/ticker/${encodeURIComponent(pair)}`;

    try {
      const response = await this.fetchImplementation(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await safeReadText(response);

        throw new Error(`Uphold API request failed with status ${response.status}: ${body}`);
      }

      const data = (await response.json()) as UpholdTickerResponse;
      const rate = parseTickerRate(data);

      return {
        pair,
        rate,
        raw: data,
        timestamp: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseTickerRate(data: UpholdTickerResponse): number {
  const bid = Number(data.bid);
  const ask = Number(data.ask);

  if (Number.isFinite(bid) && Number.isFinite(ask)) {
    return (bid + ask) / 2;
  }

  if (Number.isFinite(bid)) {
    return bid;
  }

  if (Number.isFinite(ask)) {
    return ask;
  }

  throw new Error("Ticker response does not contain a valid bid or ask rate.");
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
