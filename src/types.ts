export type CurrencyPair = string;

export type AlertDirection = "increase" | "decrease";

export interface BotConfiguration {
  pairs: CurrencyPair[];
  intervalMs: number;
  thresholdPercentage: number;
}

export interface TickerResult {
  pair: CurrencyPair;
  rate: number;
  raw: unknown;
  timestamp: string;
}

export interface PriceAlert {
  pair: CurrencyPair;
  previousRate: number;
  currentRate: number;
  percentageChange: number;
  absolutePercentageChange: number;
  direction: AlertDirection;
  thresholdPercentage: number;
  intervalMs: number;
  timestamp: string;
  sourceTimestamp: string;
  configuration: BotConfiguration;
}

export interface AlertStore {
  save(alert: PriceAlert): Promise<void>;
  close?(): Promise<void>;
}

export interface TickerClient {
  getTicker(pair: CurrencyPair): Promise<TickerResult>;
}

export interface Logger {
  debug(message: string, metadata?: unknown): void;
  info(message: string, metadata?: unknown): void;
  warn(message: string, metadata?: unknown): void;
  error(message: string, metadata?: unknown): void;
}
