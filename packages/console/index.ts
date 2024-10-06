import { bgBlue, black } from 'colorette';
import {
  Array as A,
  Console,
  Effect,
  flow,
  LogLevel as EffectLogLevel,
  Match,
  pipe,
} from 'effect';

import { SYMBOLS } from '../constants.js';
import {
  logColors,
  logGroupColors,
  LogLevel,
  PrintFn,
  printLogLevel,
} from './colors.js';
import * as Formatters from './formatter.js';

const colorise = (l: LogLevel) => {
  const coloriser = logColors[l];

  return (...s: readonly unknown[]): string =>
    pipe(s, A.map(flow(String, coloriser)), A.join(''));
};

export const debug = flow(colorise('debug'), Console.debug);
export const log = flow(colorise('log'), Console.log);
export const info = flow(colorise('info'), Console.info);
export const warn = flow(colorise('warn'), Console.warn);
export const error = flow(colorise('error'), Console.error);
export const success = flow(colorise('success'), Console.info);

export const successWithSymbol = (...s: readonly unknown[]) =>
  Console.info(SYMBOLS.success, colorise('success')(s));

export const file = (s: string) =>
  Console.log(`${SYMBOLS.directory} ${Formatters.file(s)}`);

export const header = flow(
  Formatters.center,
  Effect.flatMap(flow(black, bgBlue, Console.log)),
);

export const logGroup = (logLevel: LogLevel, groupName: string) => {
  return (message?: string) =>
    Effect.gen(function* () {
      const groupPrinter = getLogGroupPrinter(logLevel);
      yield* groupPrinter(Formatters.spacer(groupName));

      if (message) {
        const printer = getLogPrinter(logLevel);
        yield* printer(message);
      }
    });
};

type LogLevelPrinter = (logLevel: LogLevel) => PrintFn;

const getLogGroupPrinter: LogLevelPrinter = pipe(
  Match.type<LogLevel>(),
  Match.when('log', printLogLevel(Console.log, logGroupColors)),
  Match.when('debug', printLogLevel(Console.debug, logGroupColors)),
  Match.when('info', printLogLevel(Console.info, logGroupColors)),
  Match.when('warn', printLogLevel(Console.warn, logGroupColors)),
  Match.when('error', printLogLevel(Console.error, logGroupColors)),
  Match.when('success', printLogLevel(success, logGroupColors)),
  Match.exhaustive,
);

const getLogPrinter: LogLevelPrinter = pipe(
  Match.type<LogLevel>(),
  Match.when('log', printLogLevel(Console.log, logColors)),
  Match.when('debug', printLogLevel(Console.debug, logColors)),
  Match.when('info', printLogLevel(Console.info, logColors)),
  Match.when('warn', printLogLevel(Console.warn, logColors)),
  Match.when('error', printLogLevel(Console.error, logColors)),
  Match.when('success', printLogLevel(success, logColors)),
  Match.exhaustive,
);

/**
 * Sets production log level to Info, unless
 * the --verbose flag is passed in
 *
 * Defaults to all in development, but can be overridden
 * with the --verbose flag also
 */
export const setLogLevel = (verbose: boolean) => {
  if (verbose) {
    return EffectLogLevel.All;
  }

  if (process.env.NODE_ENV === 'production') {
    return EffectLogLevel.Info;
  }

  return EffectLogLevel.All;
};
