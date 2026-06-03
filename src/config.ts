import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { normalizePairs } from "./utils.js";

const DEFAULT_PAIRS = ["BTC-USD"];
const DEFAULT_INTERVAL_MS = 5000;
const DEFAULT_THRESHOLD_PERCENTAGE = 0.01;
const DEFAULT_UPHOLD_BASE_URL = "https://api.uphold.com";
const DEFAULT_REQUEST_TIMEOUT_MS = 10000;

export interface AppConfig {
  pairs: string[];
  intervalMs: number;
  thresholdPercentage: number;
  databaseUrl?: string;
  upholdBaseUrl: string;
  requestTimeoutMs: number;
}

interface ParsedArgs {
  pairs: string;
  interval: number;
  threshold: number;
  databaseUrl?: string;
  upholdBaseUrl: string;
  requestTimeout: number;
}

export function parseConfig(argv: string[] = hideBin(process.argv)): AppConfig {
  const parsed = yargs(argv)
    .option("pairs", {
      alias: "p",
      type: "string",
      description: "Comma-separated currency pairs to monitor",
      default: process.env.PAIRS ?? DEFAULT_PAIRS.join(","),
    })
    .option("interval", {
      alias: "i",
      type: "number",
      description: "Fetch interval in milliseconds",
      default: Number(process.env.INTERVAL_MS ?? DEFAULT_INTERVAL_MS),
    })
    .option("threshold", {
      alias: "t",
      type: "number",
      description: "Alert threshold percentage",
      default: Number(process.env.THRESHOLD_PERCENTAGE ?? DEFAULT_THRESHOLD_PERCENTAGE),
    })
    .option("database-url", {
      alias: "d",
      type: "string",
      description: "Postgres connection string",
      default: process.env.DATABASE_URL,
    })
    .option("uphold-base-url", {
      type: "string",
      description: "Uphold API base URL",
      default: process.env.UPHOLD_BASE_URL ?? DEFAULT_UPHOLD_BASE_URL,
    })
    .option("request-timeout", {
      type: "number",
      description: "Ticker HTTP request timeout in milliseconds",
      default: Number(process.env.REQUEST_TIMEOUT_MS ?? DEFAULT_REQUEST_TIMEOUT_MS),
    })
    .help()
    .strict()
    .parseSync() as ParsedArgs;

  const pairs = normalizePairs(parsed.pairs);

  if (pairs.length === 0) {
    throw new Error("At least one currency pair must be provided.");
  }

  if (!Number.isFinite(parsed.interval) || parsed.interval <= 0) {
    throw new Error("Fetch interval must be a positive number.");
  }

  if (!Number.isFinite(parsed.threshold) || parsed.threshold <= 0) {
    throw new Error("Threshold percentage must be a positive number.");
  }

  if (!Number.isFinite(parsed.requestTimeout) || parsed.requestTimeout <= 0) {
    throw new Error("Request timeout must be a positive number.");
  }

  return {
    pairs,
    intervalMs: parsed.interval,
    thresholdPercentage: parsed.threshold,
    ...(parsed.databaseUrl ? { databaseUrl: parsed.databaseUrl } : {}),
    upholdBaseUrl: parsed.upholdBaseUrl,
    requestTimeoutMs: parsed.requestTimeout,
  };
}
