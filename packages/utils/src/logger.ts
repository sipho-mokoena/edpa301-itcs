import { Logger, ISettingsParam } from "tslog";

export interface LoggerOptions {
  name?: string;
  minLevel?: number;
  settings?: ISettingsParam<object>;
}

let logger: Logger<object>;

export function initLogger(options: LoggerOptions = {}): Logger<object> {
  logger = new Logger<object>({
    name: options.name,
    minLevel: options.minLevel,
    ...options.settings,
  });
  return logger;
}

export const log = {
  trace: (...args: unknown[]) => logger?.trace(...args),
  debug: (...args: unknown[]) => logger?.debug(...args),
  info: (...args: unknown[]) => logger?.info(...args),
  warn: (...args: unknown[]) => logger?.warn(...args),
  error: (...args: unknown[]) => logger?.error(...args),
  fatal: (...args: unknown[]) => logger?.fatal(...args),
};

export type LogFunction = (...args: unknown[]) => void;
export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export { logger };
