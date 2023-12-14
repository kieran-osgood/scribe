import { bgBlue, black, blue, cyan, green, red, yellow } from 'colorette';
import { Effect, Logger, LogLevel } from 'effect';
import { Writable } from 'stream';

import { SYMBOLS } from '../../common/constants';

// const spacer = (s: string) => ` ${s} `;
//
// type LogLevels = 'debug' | 'log' | 'info' | 'warn' | 'error';
// const logBgColors = {
//   debug: flow(bgBlue, black),
//   log: flow(bgBlue, black),
//   info: flow(bgBlue, black),
//   warn: flow(bgYellow, black),
//   error: flow(bgRed, black),
// } satisfies Record<LogLevels, (s: string) => string>;

const center = (str: string) => {
  const max = process.stdout.columns;
  return str
    .padStart(str.length + Math.floor((max - str.length) / 2), ' ')
    .padEnd(max - Math.floor(str.length / 2), ' ');
};

export const log = Effect.log;
export const logDebug = Effect.logDebug;
export const logInfo = Effect.logInfo;
export const logWarn = Effect.logWarning;
export const logError = Effect.logError;

export const logSuccess = (...s: string[]) =>
  Effect.log(`${SYMBOLS.success}  ${green(s.join())}`);

export const logFile = (s: string) =>
  Effect.log(`${SYMBOLS.directory} file://${s}`);

export const logHeader = (s: string) => Effect.log(bgBlue(black(center(s))));

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

export const provideLoggerLayer = (writable: Writable) =>
  Logger.replace(Logger.defaultLogger, logger(writable));
