import type { Logger } from "./types.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = process.env.LOG_LEVEL as LogLevel | undefined;
const currentLevel = LOG_LEVELS[configuredLevel ?? "info"] ?? LOG_LEVELS.info;

function write(level: LogLevel, message: string, metadata?: unknown): void {
  if (LOG_LEVELS[level] < currentLevel) {
    return;
  }

  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(metadata !== undefined ? { metadata } : {}),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger: Logger = {
  debug: (message, metadata) => write("debug", message, metadata),
  info: (message, metadata) => write("info", message, metadata),
  warn: (message, metadata) => write("warn", message, metadata),
  error: (message, metadata) => write("error", message, metadata),
};
