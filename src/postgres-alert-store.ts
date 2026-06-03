import pg from "pg";
import type { AlertStore, PriceAlert } from "./types.js";

const { Pool } = pg;

interface PostgresAlertStoreOptions {
  connectionString: string;
}

export class PostgresAlertStore implements AlertStore {
  private readonly pool: pg.Pool;

  constructor({ connectionString }: PostgresAlertStoreOptions) {
    if (!connectionString) {
      throw new Error("Postgres connection string is required.");
    }

    this.pool = new Pool({
      connectionString,
    });
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id BIGSERIAL PRIMARY KEY,
        pair TEXT NOT NULL,
        previous_rate NUMERIC NOT NULL,
        current_rate NUMERIC NOT NULL,
        percentage_change NUMERIC NOT NULL,
        absolute_percentage_change NUMERIC NOT NULL,
        direction TEXT NOT NULL,
        threshold_percentage NUMERIC NOT NULL,
        interval_ms INTEGER NOT NULL,
        source_timestamp TIMESTAMPTZ,
        alert_timestamp TIMESTAMPTZ NOT NULL,
        configuration JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_alerts_created_at_desc
        ON alerts (created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_alerts_pair_alert_timestamp_desc
        ON alerts (pair, alert_timestamp DESC);
    `);
  }

  async save(alert: PriceAlert): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO alerts (
          pair,
          previous_rate,
          current_rate,
          percentage_change,
          absolute_percentage_change,
          direction,
          threshold_percentage,
          interval_ms,
          source_timestamp,
          alert_timestamp,
          configuration
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        alert.pair,
        alert.previousRate,
        alert.currentRate,
        alert.percentageChange,
        alert.absolutePercentageChange,
        alert.direction,
        alert.thresholdPercentage,
        alert.intervalMs,
        alert.sourceTimestamp,
        alert.timestamp,
        JSON.stringify(alert.configuration),
      ],
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
