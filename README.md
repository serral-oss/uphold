# Uphold Price Oscillation Bot

A TypeScript bot that monitors Uphold currency pair prices and prints an alert when the price changes more than a configured percentage.

---

## Requirements

Install these before running the project:

- Node.js 20+
- npm

Optional (only for Docker and PostgreSQL bonus features):

- Docker
- Docker Compose

Check versions:

```bash
node --version
npm --version

# Optional
docker --version
docker compose version
```

---

## Environment Variables

| Variable | Default | Description |
|---|---:|---|
| `PAIRS` | `BTC-USD` | Comma-separated pairs to monitor |
| `INTERVAL_MS` | `5000` | Polling interval in milliseconds |
| `THRESHOLD_PERCENTAGE` | `0.01` | Price change percentage needed to trigger an alert |
| `LOG_LEVEL` | `info` | Log level |
| `DATABASE_URL` | empty | Optional PostgreSQL connection URL |

Example `.env` file:

```env
PAIRS=BTC-USD,ETH-USD
INTERVAL_MS=5000
THRESHOLD_PERCENTAGE=0.01
LOG_LEVEL=info
```

---

## Run Locally

Install dependencies:

```bash
npm install
```

Build the project:

```bash
npm run build
```

Start the bot:

```bash
npm start
```

Run with custom values:

```bash
PAIRS=BTC-USD,ETH-USD INTERVAL_MS=3000 THRESHOLD_PERCENTAGE=0.01 npm start
```

PowerShell equivalent:

```powershell
$env:PAIRS="BTC-USD,ETH-USD"
$env:INTERVAL_MS="3000"
$env:THRESHOLD_PERCENTAGE="0.01"
npm start
```

Or pass arguments directly:

```bash
npm start -- --pairs BTC-USD,ETH-USD --interval 3000 --threshold 0.01
```

---

## Run with Docker

Build the image:

```bash
docker build -t uphold-bot .
```

Run the bot:

```bash
docker run --rm uphold-bot
```

Run with custom values:

```bash
docker run --rm \
  -e PAIRS=BTC-USD,ETH-USD \
  -e INTERVAL_MS=5000 \
  -e THRESHOLD_PERCENTAGE=0.01 \
  uphold-bot
```

---

## Run with Docker Compose

Recommended command:

```bash
docker compose up --build
```

Run in background:

```bash
docker compose up --build -d
```

View logs:

```bash
docker compose logs -f uphold-bot
```

Stop services:

```bash
docker compose down
```

Stop and remove database data:

```bash
docker compose down -v
```

---

## PostgreSQL

When using Docker Compose, PostgreSQL starts automatically.

Connect to the database:

```bash
docker compose exec postgres psql -U uphold -d uphold_bot
```


View stored alerts:

```sql
SELECT *
FROM alerts
ORDER BY created_at DESC;
```

Exit:

```sql
\q
```

---

## Useful Commands

Run tests:

```bash
npm test
```

Type-check:

```bash
npm run typecheck
```

Clean Docker rebuild:

```bash
docker compose down -v
docker compose build --no-cache
docker compose up
```

---

## Example Output

```text
INFO Starting Uphold Bot
INFO Initial rate for BTC-USD: 68250.12
[ALERT] BTC-USD increased from 68250.12 to 68257.33
```
