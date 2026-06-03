import type { AlertStore, PriceAlert } from "./types.js";

const ANSI = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  green: "\u001b[32m",
  red: "\u001b[31m",
  cyan: "\u001b[36m",
  yellow: "\u001b[33m",
  gray: "\u001b[90m",
} as const;

const colorsEnabled = !process.env.NO_COLOR;

function colorize(value: string, color: keyof typeof ANSI): string {
  if (!colorsEnabled) {
    return value;
  }

  return `${ANSI[color]}${value}${ANSI.reset}`;
}

export class ConsoleAlertStore implements AlertStore {
  async save(alert: PriceAlert): Promise<void> {
    const isIncrease = alert.direction === "increase";

    const directionColor = isIncrease ? "green" : "red";
    const directionIcon = isIncrease ? "▲" : "▼";
    const sign = isIncrease ? "+" : "";

    const label = colorize("[ALERT]", "bold");
    const pair = colorize(alert.pair, "cyan");
    const direction = colorize(`${directionIcon} ${alert.direction.toUpperCase()}`, directionColor);

    const previousRate = colorize(String(alert.previousRate), "gray");
    const currentRate = colorize(String(alert.currentRate), directionColor);

    const percentage = colorize(`${sign}${alert.percentageChange.toFixed(6)}%`, "yellow");

    const timestamp = colorize(alert.timestamp, "dim");

    console.log(
      `${label} ${pair} ${direction} from ${previousRate} to ${currentRate} (${percentage}) at ${timestamp}`,
    );
  }
}
