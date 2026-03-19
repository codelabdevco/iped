// Lightweight structured logger (no external deps)
type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = (process.env.LOG_LEVEL || "info") as LogLevel;

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[MIN_LEVEL];
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, any>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, any>) => shouldLog("debug") && console.log(formatLog("debug", msg, meta)),
  info: (msg: string, meta?: Record<string, any>) => shouldLog("info") && console.log(formatLog("info", msg, meta)),
  warn: (msg: string, meta?: Record<string, any>) => shouldLog("warn") && console.warn(formatLog("warn", msg, meta)),
  error: (msg: string, meta?: Record<string, any>) => shouldLog("error") && console.error(formatLog("error", msg, meta)),
};
