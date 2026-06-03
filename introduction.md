# Uphold Price Oscillation Bot - Introduction

## Overview
This technical assessment project is a TypeScript command-line bot that monitors market rates for configured Uphold currency pairs and raises an alert when price movement crosses a configured percentage threshold.

The solution is designed to be:
- Deterministic: alerts are triggered from a clear baseline and threshold rule.
- Resilient: polling continues even when single requests fail.
- Extensible: alerts can be persisted to multiple destinations.
- Production-aware: supports structured logging, graceful shutdown, and optional PostgreSQL persistence.

## Core Objective
For each configured pair (for example BTC-USD), the bot repeatedly fetches ticker data from Uphold and compares the latest rate against the last alert baseline.

When absolute percentage change is greater than or equal to the threshold:
- An alert is produced.
- The alert is sent to one or more alert stores (console and optionally PostgreSQL).
- The baseline is advanced only after at least one store succeeds.

## High-Level Flow
1. Parse runtime config from CLI args and environment variables.
2. Initialize ticker client and alert stores.
3. Start independent polling loops per pair.
4. Fetch current ticker rate.
5. Compute percentage delta from last alert baseline.
6. Persist alert if threshold is reached.
7. Continue polling until process termination signal.

## Core Logic
The central decision engine is implemented in src/bot.ts and follows this per-pair rule:
1. First successful ticker read sets the baseline rate with no alert.
2. Every next read computes percentage change from baseline.
3. If absolute change is greater than or equal to threshold, create an alert payload.
4. Try saving the alert to all configured stores.
5. Advance baseline only when at least one store save succeeds.

This design prevents silent data loss and avoids alert storms caused by advancing the baseline when all persistence targets fail.

The threshold math is implemented in src/utils.ts:
- percentage change = ((current - previous) / previous) * 100
- alert condition = abs(percentage change) >= threshold

## Core Files and Responsibilities
- src/cli.ts: application entrypoint, dependency wiring, graceful shutdown handling.
- src/config.ts: CLI and environment parsing with validation for intervals, threshold, and timeouts.
- src/bot.ts: polling scheduler, pair state tracking, trigger decision, and store persistence strategy.
- src/ticker-client.ts: Uphold API fetch logic, timeout handling, response validation, and midpoint rate calculation.
- src/utils.ts: pair normalization and threshold math utilities.
- src/alert-store.ts: console alert renderer.
- src/postgres-alert-store.ts: schema initialization and durable alert inserts.
- src/logger.ts: structured JSON logging with log-level filtering.
- src/types.ts: shared contracts between bot, client, and stores.

Supporting tests:
- test/bot.test.ts: initial baseline, up/down trigger checks, below-threshold behavior, multi-store success rules.
- test/ticker-client.test.ts: midpoint calculation, API failure handling, invalid payload handling.
- test/config.test.ts and test/utils.test.ts: validation of parsing and math helpers.

## Main Components
- CLI entrypoint: bootstraps config, dependencies, and shutdown handling.
- Bot engine: stateful loop and threshold-based alerting logic.
- Ticker client: HTTP integration with Uphold ticker endpoint.
- Alert stores:
  - Console store for immediate operator visibility.
  - PostgreSQL store for durable history and querying.
- Utilities: pair normalization and percentage calculations.
- Test suite: unit tests for config parsing, math logic, ticker client, and bot behavior.

## Runtime Configuration
Key environment variables and flags include:
- PAIRS
- INTERVAL_MS
- THRESHOLD_PERCENTAGE
- DATABASE_URL
- LOG_LEVEL
- REQUEST_TIMEOUT_MS
- UPHOLD_BASE_URL

CLI arguments override defaults and are validated for positive numeric constraints.

## Reliability and Operational Notes
- Per-pair in-flight guard prevents overlapping requests for the same pair.
- Errors are logged without crashing the process loop.
- Process handles SIGINT and SIGTERM for graceful shutdown.
- Optional database failure does not block bot startup; bot continues with console alerts.

## Assessment Value
This project demonstrates practical backend engineering fundamentals:
- External API integration
- Stateful polling workflow
- Threshold-based event generation
- Multi-destination persistence strategy
- Test-driven confidence for core paths
- Container-ready execution with optional database integration
