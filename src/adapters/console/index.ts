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
import { Effect, flow, Logger, LogLevel, pipe } from 'effect';
import { Writable } from 'stream';

import { SYMBOLS } from '../../common/constants';
import { center, file, spacer } from './formatter';

export const provideLoggerLayer = (writable: Writable) =>
  Logger.replace(Logger.defaultLogger, logger(writable));

export const logger = (writable: Writable) =>
  Logger.make(({ logLevel, message }) => {
    // TODO: look into using spans/annotations for groupings?
    switch (logLevel._tag) {
      case LogLevel.None._tag:
        writable.write(String(message));
        break;
      case LogLevel.Debug._tag:
        writable.write(cyan(String(message)));
        break;
      case LogLevel.Info._tag:
        writable.write(blue(String(message)));
        break;
      case LogLevel.Warning._tag:
        writable.write(SYMBOLS.warning);
        writable.write(' ');
        writable.write(yellow(String(message)));
        break;
      case LogLevel.Error._tag:
        writable.write(SYMBOLS.error);
        writable.write(' ');
        writable.write(red(String(message)));
        break;
    }

    writable.write('\n');
  });

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

export const logHeader = (s: string) => Effect.log(bgBlue(black(center(s))));

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
