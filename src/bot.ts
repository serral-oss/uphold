import type { AlertStore, CurrencyPair, Logger, PriceAlert, TickerClient } from "./types.js";
import { calculatePercentageChange, shouldTriggerAlert } from "./utils.js";

interface PairState {
  lastAlertRate: number | null;
  isFetching: boolean;
}

interface PriceOscillationBotOptions {
  pairs: CurrencyPair[];
  intervalMs: number;
  thresholdPercentage: number;
  tickerClient: TickerClient;
  alertStores?: AlertStore[];
  logger?: Logger;
}

export class PriceOscillationBot {
  private readonly pairs: CurrencyPair[];
  private readonly intervalMs: number;
  private readonly thresholdPercentage: number;
  private readonly tickerClient: TickerClient;
  private readonly alertStores: AlertStore[];
  private readonly logger: Logger;
  private readonly timers = new Map<CurrencyPair, NodeJS.Timeout>();
  private readonly state: Map<CurrencyPair, PairState>;
  private isRunning = false;

  constructor({
    pairs,
    intervalMs,
    thresholdPercentage,
    tickerClient,
    alertStores = [],
    logger = console,
  }: PriceOscillationBotOptions) {
    this.pairs = pairs;
    this.intervalMs = intervalMs;
    this.thresholdPercentage = thresholdPercentage;
    this.tickerClient = tickerClient;
    this.alertStores = alertStores;
    this.logger = logger;

    this.state = new Map(
      pairs.map((pair) => [
        pair,
        {
          lastAlertRate: null,
          isFetching: false,
        },
      ]),
    );
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    this.logger.info("Starting Uphold Bot", {
      pairs: this.pairs,
      intervalMs: this.intervalMs,
      thresholdPercentage: this.thresholdPercentage,
    });

    for (const pair of this.pairs) {
      void this.checkPair(pair);

      if (this.isRunning) {
        this.scheduleRegularChecks(pair);
      }
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }

    this.timers.clear();
    this.isRunning = false;

    this.logger.info("Uphold Bot stopped");
  }

  async checkPair(pair: CurrencyPair): Promise<void> {
    const pairState = this.state.get(pair);

    if (!pairState) {
      throw new Error(`Unknown pair: ${pair}`);
    }

    if (pairState.isFetching) {
      this.logger.warn(`Skipping ${pair}; previous request is still in progress`);
      return;
    }

    pairState.isFetching = true;

    try {
      const ticker = await this.tickerClient.getTicker(pair);
      const currentRate = ticker.rate;

      if (pairState.lastAlertRate === null) {
        pairState.lastAlertRate = currentRate;

        this.logger.info(`Initial rate for ${pair}`, {
          pair,
          rate: currentRate,
          timestamp: ticker.timestamp,
        });

        return;
      }

      const percentageChange = calculatePercentageChange(pairState.lastAlertRate, currentRate);

      if (
        shouldTriggerAlert({
          previousRate: pairState.lastAlertRate,
          currentRate,
          thresholdPercentage: this.thresholdPercentage,
        })
      ) {
        const direction = currentRate > pairState.lastAlertRate ? "increase" : "decrease";

        const alert: PriceAlert = {
          pair,
          previousRate: pairState.lastAlertRate,
          currentRate,
          percentageChange,
          absolutePercentageChange: Math.abs(percentageChange),
          direction,
          thresholdPercentage: this.thresholdPercentage,
          intervalMs: this.intervalMs,
          timestamp: new Date().toISOString(),
          sourceTimestamp: ticker.timestamp,
          configuration: {
            pairs: this.pairs,
            intervalMs: this.intervalMs,
            thresholdPercentage: this.thresholdPercentage,
          },
        };

        const persisted = await this.persistAlert(alert);

        if (persisted) {
          pairState.lastAlertRate = currentRate;
        } else {
          this.logger.warn(`Alert for ${pair} was not stored in any destination`, {
            pair,
            currentRate,
            previousRate: pairState.lastAlertRate,
          });
        }
      } else {
        this.logger.debug(`No alert for ${pair}`, {
          pair,
          currentRate,
          lastAlertRate: pairState.lastAlertRate,
          percentageChange,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process ticker for ${pair}`, {
        pair,
        ...normalizeError(error),
      });
    } finally {
      pairState.isFetching = false;
    }
  }

  private async persistAlert(alert: PriceAlert): Promise<boolean> {
    if (this.alertStores.length === 0) {
      return true;
    }

    const results = await Promise.allSettled(this.alertStores.map((store) => store.save(alert)));

    let successCount = 0;

    for (const [index, result] of results.entries()) {
      if (result.status === "fulfilled") {
        successCount += 1;
      } else {
        this.logger.error("Failed to store alert", {
          pair: alert.pair,
          store: getStoreName(this.alertStores[index], index),
          ...normalizeError(result.reason),
        });
      }
    }

    return successCount > 0;
  }

  private scheduleRegularChecks(pair: CurrencyPair): void {
    const timer = setInterval(() => {
      void this.checkPair(pair);
    }, this.intervalMs);

    this.timers.set(pair, timer);
  }
}

function getStoreName(store: AlertStore, index: number): string {
  const constructorName = (store as { constructor?: { name?: string } }).constructor?.name;

  if (constructorName && constructorName.length > 0) {
    return constructorName;
  }

  return `store-${index}`;
}

function normalizeError(error: unknown): { error: string; stack?: string } {
  if (error instanceof Error) {
    return {
      error: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }

  return {
    error: String(error),
  };
}
