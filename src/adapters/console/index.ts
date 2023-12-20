import {
  bgBlue,
  bgGreen,
  bgRed,
  bgYellow,
  black,
  blue,
  cyan,
  green,
  red,
  yellow,
} from 'colorette';
import { Console, Effect, flow, Logger, LogLevel, pipe } from 'effect';

import { SYMBOLS } from '../../common/constants';
import { center, file, spacer } from './formatter';

export const logger = Logger.make(({ logLevel, message }) => {
  switch (logLevel._tag) {
    case LogLevel.None._tag:
      console.log(String(message));
      break;
    case LogLevel.Debug._tag:
      console.log(cyan(String(message)));
      break;
    case LogLevel.Info._tag:
      console.log(blue(String(message)));
      break;
    case LogLevel.Warning._tag:
      console.log(`${SYMBOLS.warning} ${yellow(String(message))}`);
      break;
    case LogLevel.Error._tag:
      console.log(`${SYMBOLS.error} ${red(String(message))}`);
      break;
  }

  // writable.write('\n');
});

export const loggerLayer = Logger.replace(Logger.defaultLogger, logger);

// Core - styling handled via {@logger}
export const log = Effect.log;
export const logDebug = Effect.logDebug;
export const logInfo = Effect.logInfo;
export const logWarn = Effect.logWarning;
export const logError = Effect.logError;

// Custom implementations
export const logSuccess = (...s: string[]) =>
  Effect.log(`${SYMBOLS.success}  ${green(s.join())}`);

export const logFile = (s: string) =>
  Effect.log(`${SYMBOLS.directory} ${file(s)}`);

export const logHeader = flow(center, black, bgBlue, Console.log);

type LogLevel = 'debug' | 'log' | 'info' | 'warn' | 'error' | 'success';
const logBgColors = {
  debug: flow(bgBlue, black),
  log: flow(bgBlue, black),
  info: flow(bgBlue, black),
  warn: flow(bgYellow, black),
  error: flow(bgRed, black),
  success: flow(bgGreen, black),
} satisfies Record<LogLevel, (s: string) => string>;

export const logGroup = (logLevel: LogLevel, g: string) => (s?: string) => {
  return pipe(
    Effect.log(logBgColors[logLevel](spacer(g))),
    Effect.tap(() => (s ? Effect.log(s) : Effect.unit)),
  );
};
