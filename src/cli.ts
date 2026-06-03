#!/usr/bin/env node

import "dotenv/config";
import { ConsoleAlertStore } from "./alert-store.js";
import { PriceOscillationBot } from "./bot.js";
import { parseConfig } from "./config.js";
import { logger } from "./logger.js";
import { PostgresAlertStore } from "./postgres-alert-store.js";
import { UpholdTickerClient } from "./ticker-client.js";
import type { AlertStore } from "./types.js";

async function main(): Promise<void> {
  const config = parseConfig(process.argv.slice(2));

  const tickerClient = new UpholdTickerClient({
    baseUrl: config.upholdBaseUrl,
    timeoutMs: config.requestTimeoutMs,
  });

  const stores: AlertStore[] = [new ConsoleAlertStore()];

  if (config.databaseUrl) {
    try {
      const postgresStore = new PostgresAlertStore({
        connectionString: config.databaseUrl,
      });

      await postgresStore.initialize();
      stores.push(postgresStore);
    } catch (error: unknown) {
      logger.warn("Database connection failed. Continuing without PostgreSQL alert storage.", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const bot = new PriceOscillationBot({
    pairs: config.pairs,
    intervalMs: config.intervalMs,
    thresholdPercentage: config.thresholdPercentage,
    tickerClient,
    alertStores: stores,
    logger,
  });

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);

    await bot.stop();

    for (const store of stores) {
      if (store.close) {
        await store.close();
      }
    }

    process.exit(0);
  };

  process.on("SIGINT", (signal) => {
    void shutdown(signal);
  });

  process.on("SIGTERM", (signal) => {
    void shutdown(signal);
  });

  await bot.start();
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    logger.error("Fatal error while running Uphold Bot", {
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.error("Fatal error while running Uphold Bot", {
      error: String(error),
    });
  }

  process.exit(1);
});
